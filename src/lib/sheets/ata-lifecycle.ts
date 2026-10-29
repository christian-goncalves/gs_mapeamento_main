import "server-only";

import type { sheets_v4 } from "@googleapis/sheets";
import { randomUUID } from "node:crypto";
import type { AtaCompleta } from "@/domain/rules";
import type { AtaSubmission } from "@/domain/form-schemas";
import type { Ata } from "@/domain/entities";
import { servidorFuncoes } from "@/domain/enums";
import {
  GroupFunctionCatalogUnavailableError,
  normalizeServerFunctionName,
  SERVER_FUNCTION_MAX_LENGTH,
  serverFunctionComparisonKey,
} from "@/domain/server-functions";
import { canAccessGroup, resolveAccessByEmailFromAggregated } from "@/lib/auth/access";
import { materializeAtaSubmission } from "@/domain/submission";
import {
  assertUniqueAtaSequence,
  nextAtaSequence,
  type AtaIdentifier,
} from "@/domain/ata-identifiers";
import { readAggregatedAtas } from "./repository";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { rowsToVersionedObjects, sheetReadRange, V2_NEW_SHEET_HEADERS } from "./contract-v2";
import { parseRows, type ParsedRow, type SheetCell } from "./rows";
import {
  sheetAtaSchema,
  sheetAtaToDomain,
  sheetAtaBusinessKeySchema,
  sheetGrupoFuncaoServidorToDomain,
} from "./schemas";
import {
  buildAtomicWriteRequests,
  buildCellUpdateRequest,
  executeAtomicBatch,
  firstEmptyDataRowNumber,
} from "./write";
import type { SheetName } from "./contract";

const recordSheets = [
  "atas",
  "servidores",
  "participacao",
  "visitantes",
  "ingressos",
  "trocas_chaveiro",
] as const satisfies readonly SheetName[];

const lifecycleHeaders = [
  "status_registro",
  "status_aprovacao",
  "revisao_de_ata_id",
  "motivo_alteracao",
  "alterado_por",
  "alterado_em",
  "excluida_em",
  "aprovado_por",
  "aprovado_em",
] as const;

type LifecycleSnapshot = {
  sheets: ReturnType<typeof getSheetsClient>;
  spreadsheetId: string;
  rows: Record<(typeof recordSheets)[number], SheetCell[][]>;
  ataHeaders: string[];
  ataRows: ParsedRow<Ata>[];
  metadata: sheets_v4.Schema$Spreadsheet;
};

async function readLifecycleSnapshot(): Promise<LifecycleSnapshot> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const [valuesResponse, metadata] = await Promise.all([
    sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: recordSheets.map(sheetReadRange),
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "SERIAL_NUMBER",
    }),
    sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)))",
    }),
  ]);
  const rows = Object.fromEntries(recordSheets.map((name, index) => [
    name,
    (valuesResponse.data.valueRanges?.[index]?.values as SheetCell[][] | undefined) ?? [],
  ])) as LifecycleSnapshot["rows"];
  const ataHeaders = (rows.atas[0] ?? []).map(String);
  const missing = lifecycleHeaders.filter((header) => !ataHeaders.includes(header));
  if (missing.length) {
    throw new Error(`Contrato de ciclo de vida ainda não está disponível na aba atas. Colunas ausentes: ${missing.join(", ")}.`);
  }
  const locatedAtaRows = rowsToVersionedObjects("atas", rows.atas);
  return {
    sheets,
    spreadsheetId,
    rows,
    ataHeaders,
    ataRows: parseRows("atas", sheetAtaSchema, locatedAtaRows, sheetAtaToDomain),
    metadata: metadata.data,
  };
}

function sheetIdFor(snapshot: LifecycleSnapshot, name: string) {
  const sheetId = snapshot.metadata.sheets?.find(
    (sheet) => sheet.properties?.title === name,
  )?.properties?.sheetId;
  if (typeof sheetId !== "number") throw new Error(`ID da aba ${name} não encontrado.`);
  return sheetId;
}

function assertActorCanAccess(actorEmail: string, groupId: string, aggregate: Awaited<ReturnType<typeof readAggregatedAtas>>) {
  return resolveAccessByEmailFromAggregated(actorEmail, aggregate).then((access) => {
    if (!access || !canAccessGroup(access, groupId)) {
      throw new Error("Ata não encontrada ou sem permissão para este grupo.");
    }
    return access;
  });
}

function validAtaRows(snapshot: LifecycleSnapshot) {
  return snapshot.ataRows.filter(
    (row): row is Extract<typeof row, { valid: true }> => row.valid,
  );
}

function currentAta(snapshot: LifecycleSnapshot, ataId: string) {
  const row = validAtaRows(snapshot).find((candidate) => candidate.data.ata_id === ataId);
  if (!row) throw new Error("Ata não encontrada ou inválida.");
  return row;
}

function updateAtaField(
  sheetId: number,
  rowNumber: number,
  headers: string[],
  field: string,
  value: string,
) : sheets_v4.Schema$Request {
  const column = headers.indexOf(field);
  if (column < 0) throw new Error(`Coluna ${field} ausente na aba atas.`);
  return {
    updateCells: {
      range: {
        sheetId,
        startRowIndex: rowNumber - 1,
        endRowIndex: rowNumber,
        startColumnIndex: column,
        endColumnIndex: column + 1,
      },
      rows: [{ values: [{ userEnteredValue: { stringValue: value } }] }],
      fields: "userEnteredValue",
    },
  };
}

function prepareRows(snapshot: LifecycleSnapshot, requests: sheets_v4.Schema$Request[]) {
  const properties = new Map(
    (snapshot.metadata.sheets ?? []).flatMap((sheet) =>
      typeof sheet.properties?.sheetId === "number"
        ? [[sheet.properties.sheetId, sheet.properties.gridProperties?.rowCount ?? 0] as const]
        : [],
    ),
  );
  return requests.flatMap((request) => {
    const range = request.updateCells?.range;
    if (typeof range?.sheetId !== "number" || typeof range.endRowIndex !== "number") return [];
    const rowCount = properties.get(range.sheetId);
    if (typeof rowCount !== "number" || range.endRowIndex <= rowCount) return [];
    return [{
      appendDimension: {
        sheetId: range.sheetId,
        dimension: "ROWS" as const,
        length: range.endRowIndex - rowCount,
      },
    }];
  });
}

function assertExpectedUpdatedAt(actual: string, expected: string) {
  if (!expected || actual !== expected) {
    throw new Error("A ata foi alterada desde que você abriu o formulário. Atualize a página e tente novamente.");
  }
}

export async function reviseAtaInSheets({
  ataId,
  expectedUpdatedAt,
  motivo,
  submission,
  actorEmail,
}: {
  ataId: string;
  expectedUpdatedAt: string;
  motivo: string;
  submission: AtaSubmission;
  actorEmail: string;
}) {
  const [snapshot, aggregate] = await Promise.all([readLifecycleSnapshot(), readAggregatedAtas()]);
  const oldRow = currentAta(snapshot, ataId);
  const oldAta = oldRow.data;
  const access = await assertActorCanAccess(actorEmail, oldAta.grupo_id, aggregate);
  const fixedFunctionByKey = new Map(
    servidorFuncoes.map((funcao) => [serverFunctionComparisonKey(funcao), funcao]),
  );
  const existingFunctionByKey = new Map(
    (aggregate.grupo_funcoes_servidor ?? [])
      .filter((funcao) => funcao.grupo_id === oldAta.grupo_id)
      .map((funcao) => [funcao.nome_normalizado, funcao.nome]),
  );
  const canonicalSubmission: AtaSubmission = {
    ...submission,
    servidores: submission.servidores.map((servidor) => {
      if (servidor.funcao.trim().length > SERVER_FUNCTION_MAX_LENGTH) {
        throw new Error(`O nome da função deve ter no máximo ${SERVER_FUNCTION_MAX_LENGTH} caracteres.`);
      }
      const normalized = normalizeServerFunctionName(servidor.funcao);
      const key = serverFunctionComparisonKey(normalized);
      return {
        ...servidor,
        funcao: fixedFunctionByKey.get(key) ?? existingFunctionByKey.get(key) ?? normalized,
      };
    }),
  };
  const newFunctionNames = [...new Set(
    canonicalSubmission.servidores
      .map((servidor) => servidor.funcao)
      .filter((funcao) => funcao && !fixedFunctionByKey.has(serverFunctionComparisonKey(funcao)))
      .filter((funcao) => !existingFunctionByKey.has(serverFunctionComparisonKey(funcao))),
  )];
  assertExpectedUpdatedAt(oldAta.updated_at, expectedUpdatedAt);
  if (oldAta.status_registro !== "ativa") throw new Error("Somente atas ativas podem ser editadas.");
  if (!["aprovada", "pendente_revisao"].includes(oldAta.status_aprovacao ?? "aprovada")) {
    throw new Error("Estado de aprovação inválido para edição.");
  }
  if (canonicalSubmission.ata.grupo_id !== oldAta.grupo_id) throw new Error("A edição não pode mudar o grupo da ata.");
  if (!motivo.trim()) throw new Error("Informe o motivo da alteração.");

  const duplicate = validAtaRows(snapshot).some((row) => {
    if (row.data.ata_id === ataId || row.data.status_registro !== "ativa") return false;
    const key = sheetAtaBusinessKeySchema.safeParse(row.data);
    return key.success
      && key.data.grupo_id === canonicalSubmission.ata.grupo_id
      && key.data.data_reuniao === canonicalSubmission.ata.data_reuniao
      && key.data.hora_inicio === canonicalSubmission.ata.hora_inicio;
  });
  if (duplicate) throw new Error("A ata com esta data e horário já está preenchida. Escolha outra data e outro horário.");

  const identifiers: AtaIdentifier[] = validAtaRows(snapshot).map(({ data }) => ({
    ata_id: data.ata_id,
    grupo_id: data.grupo_id,
    numero_sequencial_grupo: data.numero_sequencial_grupo,
    indice_personalizado_grupo: data.indice_personalizado_grupo,
  }));
  const sequence = nextAtaSequence(oldAta.grupo_id, identifiers);
  assertUniqueAtaSequence(oldAta.grupo_id, sequence, identifiers);
  const now = new Date().toISOString();
  const originalApproval = oldAta.status_aprovacao ?? "aprovada";
  const created = materializeAtaSubmission(
    canonicalSubmission,
    { now: () => now, uuid: randomUUID },
    {
      numero_sequencial_grupo: sequence,
      indice_personalizado_grupo: oldAta.indice_personalizado_grupo,
    },
  );
  const newRecord: AtaCompleta = {
    ...created,
    ata: {
      ...created.ata,
      status_registro: "ativa",
      status_aprovacao: originalApproval,
      revisao_de_ata_id: oldAta.ata_id,
      motivo_alteracao: motivo.trim(),
      alterado_por: access.email,
      alterado_em: now,
      aprovado_por: originalApproval === "aprovada"
        ? oldAta.aprovado_por || access.email
        : "",
      aprovado_em: originalApproval === "aprovada"
        ? oldAta.aprovado_em || now
        : "",
    },
  };
  const oldUpdated: AtaCompleta["ata"] = {
    ...oldAta,
    status_registro: "substituida",
    motivo_alteracao: motivo.trim(),
    alterado_por: access.email,
    alterado_em: now,
    updated_at: now,
  };

  let groupFunctionValues: SheetCell[][] = [];
  if (newFunctionNames.length > 0) {
    try {
      const response = await snapshot.sheets.spreadsheets.values.get({
        spreadsheetId: snapshot.spreadsheetId,
        range: "grupo_funcoes_servidor!A:G",
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "SERIAL_NUMBER",
      });
      groupFunctionValues = (response.data.values as SheetCell[][] | undefined) ?? [];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Unable to parse range: grupo_funcoes_servidor!")) {
        throw new GroupFunctionCatalogUnavailableError();
      }
      throw error;
    }
  }

  const nextRows = Object.fromEntries(recordSheets.map((name) => [
    name,
    firstEmptyDataRowNumber(snapshot.rows[name]),
  ])) as Parameters<typeof buildAtomicWriteRequests>[2];
  const sheetIds = Object.fromEntries(recordSheets.map((name) => [name, sheetIdFor(snapshot, name)])) as Parameters<typeof buildAtomicWriteRequests>[1];
  const writeRequests = buildAtomicWriteRequests(
    newRecord,
    sheetIds,
    nextRows,
  );
  const newFunctionRows = newFunctionNames.map((nome) => ({
    grupo_funcao_servidor_id: randomUUID(),
    grupo_id: canonicalSubmission.ata.grupo_id,
    nome,
    nome_normalizado: serverFunctionComparisonKey(nome),
    ativo: true,
    created_at: now,
    updated_at: now,
  }));
  const customFunctionRequests = newFunctionRows.length > 0
    ? newFunctionRows.map((funcao, index) => {
      const values = {
        ...sheetGrupoFuncaoServidorToDomain(funcao),
      };
      return buildCellUpdateRequest(
        sheetIdFor(snapshot, "grupo_funcoes_servidor"),
        firstEmptyDataRowNumber(groupFunctionValues) + index,
        V2_NEW_SHEET_HEADERS.grupo_funcoes_servidor.map((header) => values[header as keyof typeof values] ?? ""),
      );
    })
    : [];
  const allWriteRequests = [...writeRequests, ...customFunctionRequests];
  const oldSheetId = sheetIdFor(snapshot, "atas");
  const oldFieldUpdates = [
    updateAtaField(oldSheetId, oldRow.rowNumber, snapshot.ataHeaders, "status_registro", "substituida"),
    updateAtaField(oldSheetId, oldRow.rowNumber, snapshot.ataHeaders, "motivo_alteracao", oldUpdated.motivo_alteracao ?? ""),
    updateAtaField(oldSheetId, oldRow.rowNumber, snapshot.ataHeaders, "alterado_por", oldUpdated.alterado_por ?? ""),
    updateAtaField(oldSheetId, oldRow.rowNumber, snapshot.ataHeaders, "alterado_em", oldUpdated.alterado_em ?? ""),
    updateAtaField(oldSheetId, oldRow.rowNumber, snapshot.ataHeaders, "updated_at", oldUpdated.updated_at),
  ];
  const expand = prepareRows(snapshot, allWriteRequests);
  await executeAtomicBatch(snapshot.sheets, snapshot.spreadsheetId, [
    ...expand,
    ...oldFieldUpdates,
    ...allWriteRequests,
  ]);
  return { ataId: newRecord.ata.ata_id, statusAprovacao: originalApproval };
}

export async function deleteAtaInSheets({
  ataId,
  expectedUpdatedAt,
  motivo,
  actorEmail,
}: {
  ataId: string;
  expectedUpdatedAt: string;
  motivo: string;
  actorEmail: string;
}) {
  const [snapshot, aggregate] = await Promise.all([readLifecycleSnapshot(), readAggregatedAtas()]);
  const row = currentAta(snapshot, ataId);
  const ata = row.data;
  const access = await assertActorCanAccess(actorEmail, ata.grupo_id, aggregate);
  assertExpectedUpdatedAt(ata.updated_at, expectedUpdatedAt);
  if (ata.status_registro !== "ativa" || ata.status_aprovacao !== "aprovada") {
    throw new Error("Somente atas ativas e aprovadas podem ser excluídas.");
  }
  if (!motivo.trim()) throw new Error("Informe o motivo da exclusão.");

  const now = new Date().toISOString();
  const sheetId = sheetIdFor(snapshot, "atas");
  const updates = [
    updateAtaField(sheetId, row.rowNumber, snapshot.ataHeaders, "status_registro", "excluida"),
    updateAtaField(sheetId, row.rowNumber, snapshot.ataHeaders, "motivo_alteracao", motivo.trim()),
    updateAtaField(sheetId, row.rowNumber, snapshot.ataHeaders, "alterado_por", access.email),
    updateAtaField(sheetId, row.rowNumber, snapshot.ataHeaders, "alterado_em", now),
    updateAtaField(sheetId, row.rowNumber, snapshot.ataHeaders, "excluida_em", now),
    updateAtaField(sheetId, row.rowNumber, snapshot.ataHeaders, "updated_at", now),
  ];
  await executeAtomicBatch(snapshot.sheets, snapshot.spreadsheetId, updates);
}
