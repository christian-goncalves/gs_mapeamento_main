import "server-only";

import { randomUUID } from "node:crypto";
import type { Grupo, GrupoHorario } from "@/domain/entities";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { SHEET_HEADERS, type SheetName } from "./contract";
import { parseRows, rowsToObjects, type ParsedRow, type SheetCell } from "./rows";
import {
  domainGrupoHorarioToSheet,
  domainGrupoToSheet,
  sheetGrupoHorarioSchema,
  sheetGrupoHorarioToDomain,
  sheetGrupoSchema,
  sheetGrupoToDomain,
} from "./schemas";

type ValidRow<T> = Extract<ParsedRow<T>, { valid: true }>;
type Identity = {
  now: () => string;
  uuid: () => string;
};

const defaultIdentity: Identity = {
  now: () => new Date().toISOString(),
  uuid: () => randomUUID(),
};

async function readSheet(name: SheetName) {
  const values = await readSheetValues(name);
  return rowsToObjects(SHEET_HEADERS[name], values);
}

async function readSheetValues(name: SheetName) {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${name}!A:Z`,
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });
  return (response.data.values as SheetCell[][] | undefined) ?? [];
}

function rowValues<T extends Record<string, SheetCell>>(
  sheet: SheetName,
  row: T,
) {
  return SHEET_HEADERS[sheet].map((header) => row[header] ?? "");
}

async function updateRow(
  sheet: SheetName,
  rowNumber: number,
  values: SheetCell[],
) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheet}!A${rowNumber}:${String.fromCharCode(64 + values.length)}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

async function appendRow(sheet: SheetName, values: SheetCell[]) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${sheet}!A:Z`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
}

async function sheetIdByName(name: SheetName) {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
    fields: "sheets(properties(sheetId,title))",
  });
  const sheetId = response.data.sheets?.find(
    (sheet) => sheet.properties?.title === name,
  )?.properties?.sheetId;
  if (!Number.isInteger(sheetId) || sheetId == null) {
    throw new Error(`Aba não encontrada: ${name}.`);
  }
  return sheetId;
}

function isBlankSheetCell(value: SheetCell | undefined) {
  return value === "" || value === null || typeof value === "undefined";
}

export function findFirstWritableGroupRow(values: SheetCell[][]) {
  const headers = values[0] ?? [];
  const indexes = ["grupo_id", "zoom_id", "grupo_nome"].map((header) =>
    headers.indexOf(header),
  );
  if (indexes.some((index) => index < 0)) {
    return Math.max(values.length + 1, 2);
  }

  for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    const row = values[rowIndex] ?? [];
    const emptyIdentity = indexes.every((index) =>
      isBlankSheetCell(row[index]),
    );
    if (emptyIdentity) return rowIndex + 1;
  }

  return values.length + 1;
}

export async function readGroupAdminRows() {
  const [grupoRows, horarioRows] = await Promise.all([
    readSheet("grupos"),
    readSheet("grupo_horarios"),
  ]);
  return {
    grupos: parseRows(
      "grupos",
      sheetGrupoSchema,
      grupoRows,
      sheetGrupoToDomain,
    ),
    grupo_horarios: parseRows(
      "grupo_horarios",
      sheetGrupoHorarioSchema,
      horarioRows,
      sheetGrupoHorarioToDomain,
    ),
  };
}

export async function saveGrupo(
  input: Omit<Grupo, "created_at" | "updated_at"> & Partial<Pick<Grupo, "created_at" | "updated_at">>,
  identity: Identity = defaultIdentity,
) {
  const rows = await readGroupAdminRows();
  const validGroups = rows.grupos.filter(
    (row): row is ValidRow<Grupo> => row.valid,
  );
  const existing = validGroups.find(
    (row) => row.data.grupo_id === input.grupo_id,
  );
  const timestamp = identity.now();
  const grupo: Grupo = {
    ...input,
    created_at: input.created_at ?? existing?.data.created_at ?? timestamp,
    updated_at: timestamp,
  };
  const values = rowValues("grupos", domainGrupoToSheet(grupo));
  if (existing) {
    await updateRow("grupos", existing.rowNumber, values);
  } else {
    const rawRows = await readSheetValues("grupos");
    await updateRow("grupos", findFirstWritableGroupRow(rawRows), values);
  }
  return grupo;
}

export async function saveGrupoHorario(
  input: Omit<GrupoHorario, "horario_id" | "created_at" | "updated_at"> &
    Partial<Pick<GrupoHorario, "horario_id" | "created_at" | "updated_at">>,
  identity: Identity = defaultIdentity,
) {
  const rows = await readGroupAdminRows();
  const validHorarios = rows.grupo_horarios.filter(
    (row): row is ValidRow<GrupoHorario> => row.valid,
  );
  const existing = input.horario_id
    ? validHorarios.find((row) => row.data.horario_id === input.horario_id)
    : undefined;
  const timestamp = identity.now();
  const horario: GrupoHorario = {
    ...input,
    horario_id: input.horario_id ?? identity.uuid(),
    created_at: input.created_at ?? existing?.data.created_at ?? timestamp,
    updated_at: timestamp,
  };
  const values = rowValues(
    "grupo_horarios",
    domainGrupoHorarioToSheet(horario),
  );
  if (existing) {
    await updateRow("grupo_horarios", existing.rowNumber, values);
  } else {
    await appendRow("grupo_horarios", values);
  }
  return horario;
}

export async function deleteGrupoHorarios(horarioIds: string[]) {
  const ids = new Set(horarioIds.filter(Boolean));
  if (ids.size === 0) return;

  const rows = await readGroupAdminRows();
  const rowNumbers = rows.grupo_horarios
    .filter(
      (row): row is ValidRow<GrupoHorario> =>
        row.valid && ids.has(row.data.horario_id),
    )
    .map((row) => row.rowNumber)
    .sort((first, second) => second - first);
  if (rowNumbers.length === 0) return;

  const sheetId = await sheetIdByName("grupo_horarios");
  const sheets = getSheetsClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: rowNumbers.map((rowNumber) => ({
        deleteDimension: {
          range: {
            sheetId,
            dimension: "ROWS",
            startIndex: rowNumber - 1,
            endIndex: rowNumber,
          },
        },
      })),
    },
  });
}
