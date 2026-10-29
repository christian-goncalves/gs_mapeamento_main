import "server-only";

import type { sheets_v4 } from "@googleapis/sheets";
import {
  InvalidAtaIdentifiersError,
  nextAtaCreationIdentifiers,
} from "@/domain/ata-identifiers";
import type { AtaSubmission } from "@/domain/form-schemas";
import { servidorFuncoes } from "@/domain/enums";
import {
  GroupFunctionCatalogUnavailableError,
  normalizeServerFunctionName,
  SERVER_FUNCTION_MAX_LENGTH,
  serverFunctionComparisonKey,
} from "@/domain/server-functions";
import { assertCreationAllowed, type AtaBusinessKey } from "@/domain/creation";
import { materializeAtaSubmission } from "@/domain/submission";
import { resolveAtaPlatform } from "@/domain/ata-platform";
import { SheetsOperationError } from "@/domain/sheets-operation-error";
import { updateAtaNameSuggestionsFromSubmission } from "@/lib/ata-name-suggestions.server";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { SHEET_HEADERS, type SheetName } from "./contract";
import { compatibleHeaders, groupPlatformRowsToObjects, rowsToVersionedObjects, sheetReadRange, V2_NEW_SHEET_HEADERS } from "./contract-v2";
import { parseRows, rowsToObjects, type SheetCell } from "./rows";
import {
  sheetAtaBusinessKeySchema,
  sheetAtaIdentifiersSchema,
  sheetGrupoSchema,
  sheetGrupoHorarioSchema,
  sheetGrupoHorarioToDomain,
  domainGrupoFuncaoServidorToSheet,
  sheetGrupoFuncaoServidorSchema,
  sheetGrupoFuncaoServidorToDomain,
  sheetGrupoPlataformaSchema,
  sheetGrupoPlataformaToDomain,
  sheetGrupoToDomain,
} from "./schemas";
import {
  buildAtomicWriteRequests,
  buildCellUpdateRequest,
  executeAtomicBatch,
  firstEmptyDataRowNumber,
} from "./write";

function normalizeHeaderAliases(name: SheetName, values: SheetCell[][]) {
  if (name !== "visitantes" || values.length === 0) return values;
  const [headers, ...rows] = values;
  const normalizedHeaders = headers.map((header) => {
    if (header === "categoria") return "descricao";
    if (header === "origem_contato" || header === "como_chegou_a_na?") {
      return "como_chegou_a_na";
    }
    return header;
  });
  return [normalizedHeaders, ...rows];
}

export async function createAtaInSheets(
  submission: AtaSubmission,
  actorEmail?: string,
  publicLinkToken?: string,
) {
  if (Boolean(actorEmail?.trim()) === Boolean(publicLinkToken?.trim())) {
    throw new Error("Informe exatamente uma autorização: sessão autenticada ou link público válido.");
  }
  const spreadsheetId = getSpreadsheetId();
  const sheets = getSheetsClient();
  const names = Object.keys(SHEET_HEADERS) as SheetName[];
  const groupFunctionSheet = "grupo_funcoes_servidor" as const;
  const requiredNames = names;
  let readResponses;
  try {
    readResponses = await Promise.all([
      sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: requiredNames.map(sheetReadRange),
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "SERIAL_NUMBER",
      }),
      sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)))",
      }),
    ]);
  } catch (error) {
    throw new SheetsOperationError("read", { cause: error });
  }
  const [valuesResponse, metadataResponse] = readResponses;
  let groupFunctionValues: SheetCell[][] = [];
  let groupFunctionSheetMissing = false;
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "grupo_funcoes_servidor!A:G",
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "SERIAL_NUMBER",
    });
    groupFunctionValues = (response.data.values as SheetCell[][] | undefined) ?? [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes(`Unable to parse range: ${groupFunctionSheet}!`)) {
      throw new SheetsOperationError("read", { cause: error });
    }
    groupFunctionSheetMissing = true;
  }
  let platformRows: ReturnType<typeof groupPlatformRowsToObjects> = [];
  try {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: "grupo_plataformas!A:I", valueRenderOption: "UNFORMATTED_VALUE", dateTimeRenderOption: "SERIAL_NUMBER" });
    platformRows = groupPlatformRowsToObjects((response.data.values as SheetCell[][] | undefined) ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("Unable to parse range: grupo_plataformas!")) {
      throw new SheetsOperationError("read", { cause: error });
    }
  }

  const sheetValues = Object.fromEntries(
    names.map((name) => {
      const rawValues = valuesResponse.data.valueRanges?.[requiredNames.indexOf(name)]?.values;
      return [name, (rawValues as SheetCell[][] | undefined) ?? []];
    }),
  ) as Record<SheetName, SheetCell[][]>;

  const rows = Object.fromEntries(
    names.map((name) => [
      name,
      rowsToVersionedObjects(
        name,
        normalizeHeaderAliases(name, sheetValues[name]),
      ),
    ]),
  ) as Record<SheetName, ReturnType<typeof rowsToVersionedObjects>>;

  const groups = parseRows(
    "grupos",
    sheetGrupoSchema,
    rows.grupos,
    sheetGrupoToDomain,
  )
    .filter((row) => row.valid)
    .map((row) => row.data);
  const selectedGroup = groups.find(
    (group) => group.grupo_id === submission.ata.grupo_id,
  );
  if (!selectedGroup) throw new Error("Grupo da ata não encontrado.");
  const schedules = parseRows("grupo_horarios", sheetGrupoHorarioSchema, rows.grupo_horarios, sheetGrupoHorarioToDomain).flatMap((row) => row.valid ? [row.data] : []);
  const platforms = parseRows("grupo_plataformas", sheetGrupoPlataformaSchema, platformRows, sheetGrupoPlataformaToDomain).flatMap((row) => row.valid ? [row.data] : []);
  // F2: resolve a fonte do tipo no snapshot do servidor; nunca confia no cliente para recorrências.
  const resolvedPlatform = resolveAtaPlatform({ groupId: selectedGroup.grupo_id, timeZone: selectedGroup.fuso_horario, date: submission.ata.data_reuniao, time: submission.ata.hora_inicio, schedules, platforms, explicitPlatform: submission.ata.plataforma });
  const normalizedSubmission: AtaSubmission = { ...submission, ata: { ...submission.ata, plataforma: resolvedPlatform.type } };
  const fixedFunctionByKey = new Map(
    servidorFuncoes.map((funcao) => [serverFunctionComparisonKey(funcao), funcao]),
  );
  const existingFunctionRows = parseRows(
    groupFunctionSheet,
    sheetGrupoFuncaoServidorSchema,
    rowsToObjects(V2_NEW_SHEET_HEADERS.grupo_funcoes_servidor, groupFunctionValues),
    sheetGrupoFuncaoServidorToDomain,
  ).flatMap((row) => row.valid ? [row.data] : []);
  const existingFunctionByKey = new Map(
    existingFunctionRows.map((funcao) => [funcao.nome_normalizado, funcao.nome]),
  );
  const canonicalSubmission: AtaSubmission = {
    ...normalizedSubmission,
    servidores: normalizedSubmission.servidores.map((servidor) => {
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
  if (newFunctionNames.length > 0 && groupFunctionSheetMissing) {
    throw new GroupFunctionCatalogUnavailableError();
  }
  const existingKeys: AtaBusinessKey[] = rows.atas.flatMap((row) => {
    if (row.value.status_registro !== "ativa") return [];
    const result = sheetAtaBusinessKeySchema.safeParse(row.value);
    return result.success ? [result.data] : [];
  });
  const existingIdentifiers = rows.atas.flatMap((row) => {
    const result = sheetAtaIdentifiersSchema.safeParse(row.value);
    if (!result.success) throw new InvalidAtaIdentifiersError();
    return [result.data];
  });
  const activeIdentifiers = rows.atas.flatMap((row) => {
    if (row.value.status_registro !== "ativa") return [];
    const result = sheetAtaIdentifiersSchema.safeParse(row.value);
    if (!result.success) throw new InvalidAtaIdentifiersError();
    return [result.data];
  });
  const ataHeaders = sheetValues.atas[0] ?? [];
  const requiredApprovalHeaders = [
    "status_registro",
    "status_aprovacao",
    "aprovado_por",
    "aprovado_em",
  ];
  const missingApprovalHeaders = requiredApprovalHeaders.filter(
    (header) => !ataHeaders.includes(header),
  );
  if (missingApprovalHeaders.length > 0) {
    throw new Error(
      `Contrato de revisão ainda não reconciliado na aba atas. Colunas ausentes: ${missingApprovalHeaders.join(", ")}.`,
    );
  }
  assertCreationAllowed(canonicalSubmission, groups, existingKeys);
  const identifiers = nextAtaCreationIdentifiers(
    canonicalSubmission.ata.grupo_id,
    existingIdentifiers,
    activeIdentifiers,
  );

  const sheetsByName = Object.fromEntries(
    (metadataResponse.data.sheets ?? []).map((sheet) => [
      sheet.properties?.title,
      sheet.properties,
    ]),
  ) as Record<string, sheets_v4.Schema$SheetProperties | undefined>;
  const sheetIds = Object.fromEntries(
    Object.entries(sheetsByName).map(([name, properties]) => [
      name,
      properties?.sheetId,
    ]),
  ) as Record<string, number | undefined>;
  for (const name of requiredNames) {
    if (typeof sheetIds[name] !== "number") {
      throw new Error(`ID da aba ${name} não encontrado.`);
    }
  }
  if (newFunctionNames.length > 0 && typeof sheetIds[groupFunctionSheet] !== "number") {
    throw new Error(`ID da aba ${groupFunctionSheet} não encontrado.`);
  }

  // F3: materializa ata e dependentes em memória depois das validações de domínio.
  const materialized = materializeAtaSubmission(
    canonicalSubmission,
    undefined,
    identifiers,
  );
  // F4: define o estado/auditoria inicial sem alterar registros históricos.
  const registro = {
    ...materialized,
    ata: {
      ...materialized.ata,
      status_registro: "ativa" as const,
      status_aprovacao: selectedGroup?.revisao_atas_ativa
        ? ("pendente_revisao" as const)
        : ("aprovada" as const),
      aprovado_por: selectedGroup?.revisao_atas_ativa ? "" : "sistema",
      aprovado_em: selectedGroup?.revisao_atas_ativa ? "" : materialized.ata.created_at,
    },
  };
  const nextRows = {
    atas: firstEmptyDataRowNumber(sheetValues.atas),
    servidores: firstEmptyDataRowNumber(sheetValues.servidores),
    participacao: firstEmptyDataRowNumber(sheetValues.participacao),
    visitantes: firstEmptyDataRowNumber(sheetValues.visitantes),
    ingressos: firstEmptyDataRowNumber(sheetValues.ingressos),
    trocas_chaveiro: firstEmptyDataRowNumber(sheetValues.trocas_chaveiro),
  };
  const newFunctionRows = newFunctionNames.map((nome) => ({
    grupo_funcao_servidor_id: globalThis.crypto.randomUUID(),
    grupo_id: canonicalSubmission.ata.grupo_id,
    nome,
    nome_normalizado: serverFunctionComparisonKey(nome),
    ativo: true,
    created_at: materialized.ata.created_at,
    updated_at: materialized.ata.updated_at,
  }));
  const customFunctionRequests = newFunctionRows.map((funcao, index) => {
    const values = domainGrupoFuncaoServidorToSheet(funcao);
    return buildCellUpdateRequest(
      sheetIds[groupFunctionSheet]!,
      firstEmptyDataRowNumber(groupFunctionValues) + index,
      V2_NEW_SHEET_HEADERS.grupo_funcoes_servidor.map((header) => values[header as keyof typeof values] ?? ""),
    );
  });
  const requests = [
    ...buildAtomicWriteRequests(
      registro,
      sheetIds as Record<SheetName, number>,
      nextRows,
    ),
    ...customFunctionRequests,
  ];
  const prepareGridDimensions = requests.flatMap((request) => {
    const range = request.updateCells?.range;
    if (
      typeof range?.sheetId !== "number" ||
      typeof range.endRowIndex !== "number" ||
      typeof range.endColumnIndex !== "number"
    ) {
      return [];
    }
    const sheetName = names.find((name) => sheetIds[name] === range.sheetId)
      ?? (sheetIds[groupFunctionSheet] === range.sheetId ? groupFunctionSheet : undefined);
    if (!sheetName) throw new Error("Nome da aba não encontrado.");
    const gridProperties = sheetsByName[sheetName]?.gridProperties;
    const currentColumnCount = gridProperties?.columnCount;
    const currentRowCount = gridProperties?.rowCount;
    if (typeof currentColumnCount !== "number" || typeof currentRowCount !== "number") {
      throw new Error("Dimensões da aba não encontradas.");
    }
    const requestsToExpand: sheets_v4.Schema$Request[] = [];
    const missingRows = range.endRowIndex - currentRowCount;
    if (missingRows > 0) {
      requestsToExpand.push({
        appendDimension: {
          sheetId: range.sheetId,
          dimension: "ROWS",
          length: missingRows,
        },
      });
    }
    const missingColumns = range.endColumnIndex - currentColumnCount;
    if (missingColumns > 0) {
      const headers = sheetName === groupFunctionSheet
        ? V2_NEW_SHEET_HEADERS.grupo_funcoes_servidor
        : compatibleHeaders(sheetName);
      const missingHeaders = headers.slice(
        currentColumnCount,
        range.endColumnIndex,
      );
      requestsToExpand.push(
        {
          appendDimension: {
            sheetId: range.sheetId,
            dimension: "COLUMNS",
            length: missingColumns,
          },
        },
        {
          updateCells: {
            range: {
              sheetId: range.sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: currentColumnCount,
              endColumnIndex: range.endColumnIndex,
            },
            rows: [{
              values: missingHeaders.map((header) => ({
                userEnteredValue: { stringValue: header },
              })),
            }],
            fields: "userEnteredValue",
          },
        },
      );
    }
    return requestsToExpand;
  });
  try {
    await executeAtomicBatch(sheets, spreadsheetId, [
      ...prepareGridDimensions,
      ...requests,
    ]);
  } catch (error) {
    throw new SheetsOperationError("write", { cause: error });
  }
  try {
    await updateAtaNameSuggestionsFromSubmission(canonicalSubmission);
  } catch (error) {
    console.error(
      "Falha ao atualizar sugestões de nomes da ata:",
      error instanceof Error ? error.message : "erro desconhecido",
    );
  }
  return {
    ataId: registro.ata.ata_id,
    statusAprovacao: registro.ata.status_aprovacao ?? "aprovada",
  };
}
