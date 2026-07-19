import "server-only";

import {
  assertUniqueAtaCustomIndex,
  type AtaIdentifier,
} from "@/domain/ata-identifiers";
import type { Ata } from "@/domain/entities";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { SHEET_HEADERS } from "./contract";
import { parseRows, rowsToObjects, type ParsedRow, type SheetCell } from "./rows";
import { domainAtaToSheet, sheetAtaSchema, sheetAtaToDomain } from "./schemas";

type ValidRow<T> = Extract<ParsedRow<T>, { valid: true }>;
type Identity = {
  now: () => string;
};

const defaultIdentity: Identity = {
  now: () => new Date().toISOString(),
};

function columnName(index: number) {
  let name = "";
  let current = index + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

async function readAtaValues() {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: "atas!A:Z",
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });
  return (response.data.values as SheetCell[][] | undefined) ?? [];
}

async function updateAtaRow(rowNumber: number, values: SheetCell[]) {
  const sheets = getSheetsClient();
  const lastColumn = columnName(values.length - 1);
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `atas!A${rowNumber}:${lastColumn}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

async function readAtaRows() {
  const rows = rowsToObjects(SHEET_HEADERS.atas, await readAtaValues());
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

  const identifiers = validRows.map((row) => ataIdentifier(row.data));
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
