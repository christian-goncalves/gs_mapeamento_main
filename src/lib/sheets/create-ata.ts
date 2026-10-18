import "server-only";

import type { sheets_v4 } from "@googleapis/sheets";
import {
  InvalidAtaIdentifiersError,
  nextAtaCreationIdentifiers,
} from "@/domain/ata-identifiers";
import type { AtaSubmission } from "@/domain/form-schemas";
import { assertCreationAllowed, type AtaBusinessKey } from "@/domain/creation";
import { materializeAtaSubmission } from "@/domain/submission";
import { updateAtaNameSuggestionsFromSubmission } from "@/lib/ata-name-suggestions.server";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { SHEET_HEADERS, type SheetName } from "./contract";
import { compatibleHeaders, rowsToVersionedObjects, sheetReadRange } from "./contract-v2";
import { parseRows, type SheetCell } from "./rows";
import {
  sheetAtaBusinessKeySchema,
  sheetAtaIdentifiersSchema,
  sheetGrupoSchema,
  sheetGrupoToDomain,
} from "./schemas";
import {
  buildAtomicWriteRequests,
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
  const [valuesResponse, metadataResponse] = await Promise.all([
    sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: names.map(sheetReadRange),
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "SERIAL_NUMBER",
    }),
    sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)))",
    }),
  ]);

  const sheetValues = Object.fromEntries(
    names.map((name, index) => [
      name,
      (valuesResponse.data.valueRanges?.[index]?.values as
        | SheetCell[][]
        | undefined) ?? [],
    ]),
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
  const normalizedSubmission: AtaSubmission = selectedGroup
    ? {
        ...submission,
        ata: { ...submission.ata, plataforma: selectedGroup.plataforma },
      }
    : submission;
  const existingKeys: AtaBusinessKey[] = rows.atas.flatMap((row) => {
    const result = sheetAtaBusinessKeySchema.safeParse(row.value);
    return result.success ? [result.data] : [];
  });
  const existingIdentifiers = rows.atas.flatMap((row) => {
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
  assertCreationAllowed(normalizedSubmission, groups, existingKeys);
  const identifiers = nextAtaCreationIdentifiers(
    normalizedSubmission.ata.grupo_id,
    existingIdentifiers,
  );

  const sheetsByName = Object.fromEntries(
    (metadataResponse.data.sheets ?? []).map((sheet) => [
      sheet.properties?.title,
      sheet.properties,
    ]),
  ) as Partial<Record<SheetName, sheets_v4.Schema$SheetProperties>>;
  const sheetIds = Object.fromEntries(
    Object.entries(sheetsByName).map(([name, properties]) => [
      name,
      properties?.sheetId,
    ]),
  ) as Partial<Record<SheetName, number>>;
  for (const name of names) {
    if (typeof sheetIds[name] !== "number") {
      throw new Error(`ID da aba ${name} não encontrado.`);
    }
  }

  const materialized = materializeAtaSubmission(
    normalizedSubmission,
    undefined,
    identifiers,
  );
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
  const requests = buildAtomicWriteRequests(
    registro,
    sheetIds as Record<SheetName, number>,
    nextRows,
  );
  const prepareGridDimensions = requests.flatMap((request) => {
    const range = request.updateCells?.range;
    if (
      typeof range?.sheetId !== "number" ||
      typeof range.endRowIndex !== "number" ||
      typeof range.endColumnIndex !== "number"
    ) {
      return [];
    }
    const sheetName = names.find((name) => sheetIds[name] === range.sheetId);
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
      const missingHeaders = compatibleHeaders(sheetName).slice(
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
  await executeAtomicBatch(sheets, spreadsheetId, [
    ...prepareGridDimensions,
    ...requests,
  ]);
  try {
    await updateAtaNameSuggestionsFromSubmission(normalizedSubmission);
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
