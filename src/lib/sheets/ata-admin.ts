import "server-only";

import {
  assertUniqueAtaCustomIndex,
  type AtaIdentifier,
} from "@/domain/ata-identifiers";
import type { Ata } from "@/domain/entities";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { SHEET_HEADERS } from "./contract";
import { parseRows, type ParsedRow, type SheetCell } from "./rows";
import { rowsToVersionedObjects, sheetReadRange } from "./contract-v2";
import { buildCellUpdateRequest, executeAtomicBatch } from "./write";
import { domainAtaToSheet, sheetAtaSchema, sheetAtaToDomain } from "./schemas";

type ValidRow<T> = Extract<ParsedRow<T>, { valid: true }>;
type Identity = {
  now: () => string;
};

const defaultIdentity: Identity = {
  now: () => new Date().toISOString(),
};

async function readAtaValues() {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: sheetReadRange("atas"),
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });
  return (response.data.values as SheetCell[][] | undefined) ?? [];
}

async function updateAtaRow(
  rowNumber: number,
  values: SheetCell[],
) {
  const sheets = getSheetsClient();
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
    fields: "sheets(properties(sheetId,title))",
  });
  const sheetId = metadata.data.sheets?.find(
    (sheet) => sheet.properties?.title === "atas",
  )?.properties?.sheetId;
  if (typeof sheetId !== "number") throw new Error("ID da aba atas não encontrado.");
  await executeAtomicBatch(
    sheets,
    getSpreadsheetId(),
    [buildCellUpdateRequest(sheetId, rowNumber, values)],
  );
}

async function readAtaRows() {
  const values = await readAtaValues();
  const rows = rowsToVersionedObjects("atas", values);
  return parseRows("atas", sheetAtaSchema, rows, sheetAtaToDomain);
}

function ataIdentifier(ata: Ata): AtaIdentifier {
  return {
    ata_id: ata.ata_id,
    grupo_id: ata.grupo_id,
    numero_sequencial_grupo: ata.numero_sequencial_grupo,
    indice_personalizado_grupo: ata.indice_personalizado_grupo,
  };
}

export async function updateAtaCustomGroupIndex(
  ataId: string,
  indicePersonalizadoGrupo: number,
  identity: Identity = defaultIdentity,
) {
  const rows = await readAtaRows();
  const validRows = rows.filter((row): row is ValidRow<Ata> => row.valid);
  const existing = validRows.find((row) => row.data.ata_id === ataId);
  if (!existing) throw new Error("Ata não encontrada.");
  if (existing.data.status_registro !== "ativa") {
    throw new Error("Somente atas ativas podem ter o índice atualizado.");
  }

  const identifiers = validRows
    .filter((row) => (row.data.status_registro ?? "ativa") === "ativa")
    .map((row) => ataIdentifier(row.data));
  assertUniqueAtaCustomIndex(
    existing.data.grupo_id,
    indicePersonalizadoGrupo,
    identifiers,
    ataId,
  );

  const updated: Ata = {
    ...existing.data,
    indice_personalizado_grupo: indicePersonalizadoGrupo,
    updated_at: identity.now(),
  };
  await updateAtaRow(
    existing.rowNumber,
    SHEET_HEADERS.atas.map(
      (header) => domainAtaToSheet(updated)[header] ?? "",
    ),
  );
  return updated;
}
