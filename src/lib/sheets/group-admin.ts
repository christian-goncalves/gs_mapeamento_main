import "server-only";

import { randomUUID } from "node:crypto";
import type { Grupo, GrupoHorario, GrupoServidorMesa } from "@/domain/entities";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { SHEET_HEADERS, type SheetName } from "./contract";
import { rowsToCompatibleObjects, sheetReadRange } from "./contract-v2";
import { executeSheetsBatch, buildCellUpdateRequest } from "./write";
import { parseRows, type ParsedRow, type SheetCell } from "./rows";
import {
  domainGrupoHorarioToSheet,
  domainGrupoServidorMesaToSheet,
  domainGrupoToSheet,
  sheetGrupoHorarioSchema,
  sheetGrupoHorarioToDomain,
  sheetGrupoServidorMesaSchema,
  sheetGrupoServidorMesaToDomain,
  sheetGrupoSchema,
  sheetGrupoToDomain,
} from "./schemas";

type ValidRow<T> = Extract<ParsedRow<T>, { valid: true }>;
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type Identity = {
  now: () => string;
  uuid: () => string;
};

export class GroupReviewColumnMissingError extends Error {
  constructor() {
    super(
      'Não foi possível ativar a Revisão de Atas: falta a coluna "revisao_atas_ativa" no cabeçalho da planilha.',
    );
    this.name = "GroupReviewColumnMissingError";
  }
}

function requireAuthorization(value: JsonValue | undefined) {
  if (!value) throw new Error("Autorização explícita da gravação de grupo ausente.");
  return value;
}

const defaultIdentity: Identity = {
  now: () => new Date().toISOString(),
  uuid: () => randomUUID(),
};

async function readSheet(name: SheetName) {
  const values = await readSheetValues(name);
  return groupAdminRowsToObjects(name, values);
}

async function readOptionalSheet(name: SheetName) {
  try {
    return await readSheet(name);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(`Unable to parse range: ${name}!`)
    ) {
      return [];
    }
    throw error;
  }
}

export function groupAdminRowsToObjects(
  name: SheetName,
  values: SheetCell[][],
) {
  return rowsToCompatibleObjects(
    name,
    values,
    name === "grupos" ? { allowMissingTrailingHeaders: 3 } : undefined,
  );
}

async function readSheetValues(name: SheetName) {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: sheetReadRange(name),
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });
  return (response.data.values as SheetCell[][] | undefined) ?? [];
}

function rowValues<T extends Record<string, SheetCell>>(
  sheet: SheetName,
  row: T,
  headers: readonly string[] = SHEET_HEADERS[sheet],
) {
  return headers.map((header) => row[header] ?? "");
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

async function commitGroupRows(input: {
  writes?: { sheet: SheetName; rowNumber: number; values: SheetCell[] }[];
  deletes?: { sheet: SheetName; rowNumber: number }[];
}) {
  const writes = input.writes ?? [];
  const deletes = input.deletes ?? [];
  if (writes.length === 0 && deletes.length === 0) return;
  const names = [...new Set([...writes.map((item) => item.sheet), ...deletes.map((item) => item.sheet)])];
  const ids = Object.fromEntries(await Promise.all(names.map(async (name) => [name, await sheetIdByName(name)]))) as Partial<Record<SheetName, number>>;
  const requests = [
    ...writes.map(({ sheet, rowNumber, values }) => {
      const sheetId = ids[sheet];
      if (sheetId == null) throw new Error(`Aba não encontrada: ${sheet}.`);
      return buildCellUpdateRequest(
        sheetId,
        rowNumber,
        values.map((value) => (value == null ? "" : value)),
      );
    }),
    ...deletes.map(({ sheet, rowNumber }) => {
      const sheetId = ids[sheet];
      if (sheetId == null) throw new Error(`Aba não encontrada: ${sheet}.`);
      return {
        deleteDimension: {
          range: {
            sheetId,
            dimension: "ROWS",
            startIndex: rowNumber - 1,
            endIndex: rowNumber,
          },
        },
      };
    }),
  ];
  await executeSheetsBatch(requests);
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
  const [grupoRows, horarioRows, servidorMesaRows] = await Promise.all([
    readSheet("grupos"),
    readSheet("grupo_horarios"),
    readOptionalSheet("grupo_servidores_mesa"),
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
    grupo_servidores_mesa: parseRows(
      "grupo_servidores_mesa",
      sheetGrupoServidorMesaSchema,
      servidorMesaRows,
      sheetGrupoServidorMesaToDomain,
    ),
  };
}

export async function saveGrupo(
  input: Omit<Grupo, "created_at" | "updated_at"> & Partial<Pick<Grupo, "created_at" | "updated_at">>,
  identity: Identity = defaultIdentity,
  authorization?: JsonValue,
) {
  requireAuthorization(authorization);
  const snapshot = await readSheetValues("grupos");
  const validGroups = parseRows(
    "grupos",
    sheetGrupoSchema,
    groupAdminRowsToObjects("grupos", snapshot),
    sheetGrupoToDomain,
  ).filter(
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
  if (
    grupo.revisao_atas_ativa &&
    !(snapshot[0] ?? []).includes("revisao_atas_ativa")
  ) {
    throw new GroupReviewColumnMissingError();
  }
  const values = rowValues(
    "grupos",
    domainGrupoToSheet(grupo),
    snapshot[0]?.map(String) ?? SHEET_HEADERS.grupos,
  );
  await commitGroupRows({
    writes: [{
      sheet: "grupos",
      rowNumber: existing?.rowNumber ?? findFirstWritableGroupRow(snapshot),
      values,
    }],
  });
  return grupo;
}

export async function saveGrupoHorario(
  input: Omit<GrupoHorario, "horario_id" | "created_at" | "updated_at"> &
    Partial<Pick<GrupoHorario, "horario_id" | "created_at" | "updated_at">>,
  identity: Identity = defaultIdentity,
  authorization?: JsonValue,
) {
  requireAuthorization(authorization);
  const snapshot = await readSheetValues("grupo_horarios");
  const validHorarios = parseRows(
    "grupo_horarios",
    sheetGrupoHorarioSchema,
    groupAdminRowsToObjects("grupo_horarios", snapshot),
    sheetGrupoHorarioToDomain,
  ).filter(
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
  await commitGroupRows({
    writes: [{
      sheet: "grupo_horarios",
      rowNumber: existing?.rowNumber ?? snapshot.length + 1,
      values,
    }],
  });
  return horario;
}

export async function saveGrupoServidoresMesa(
  grupoId: string,
  inputs: (Omit<
    GrupoServidorMesa,
    "grupo_servidor_mesa_id" | "grupo_id" | "created_at" | "updated_at"
  > &
    Partial<
      Pick<
        GrupoServidorMesa,
        "grupo_servidor_mesa_id" | "created_at" | "updated_at"
      >
    >)[],
  identity: Identity = defaultIdentity,
  authorization?: JsonValue,
) {
  requireAuthorization(authorization);
  const snapshot = await readSheetValues("grupo_servidores_mesa");
  const validRows = parseRows(
    "grupo_servidores_mesa",
    sheetGrupoServidorMesaSchema,
    groupAdminRowsToObjects("grupo_servidores_mesa", snapshot),
    sheetGrupoServidorMesaToDomain,
  ).filter(
    (row): row is ValidRow<GrupoServidorMesa> => row.valid,
  );
  const existingForGroup = validRows.filter(
    (row) => row.data.grupo_id === grupoId,
  );
  const timestamp = identity.now();
  const nextIds = new Set(
    inputs
      .map((item) => item.grupo_servidor_mesa_id)
      .filter((id): id is string => Boolean(id)),
  );
  const rowsToSave: GrupoServidorMesa[] = [
    ...inputs.map((input) => {
      const existing = input.grupo_servidor_mesa_id
        ? validRows.find(
            (row) =>
              row.data.grupo_servidor_mesa_id ===
              input.grupo_servidor_mesa_id,
          )
        : undefined;
      return {
        ...input,
        grupo_servidor_mesa_id:
          input.grupo_servidor_mesa_id ?? identity.uuid(),
        grupo_id: grupoId,
        created_at: input.created_at ?? existing?.data.created_at ?? timestamp,
        updated_at: timestamp,
      };
    }),
    ...existingForGroup
      .filter(
        (row) =>
          row.data.ativo && !nextIds.has(row.data.grupo_servidor_mesa_id),
      )
      .map((row) => ({
        ...row.data,
        ativo: false,
        updated_at: timestamp,
      })),
  ];

  const writes = rowsToSave.map((servidor) => {
    const existing = validRows.find(
      (row) =>
        row.data.grupo_servidor_mesa_id === servidor.grupo_servidor_mesa_id,
    );
    const values = rowValues(
      "grupo_servidores_mesa",
      domainGrupoServidorMesaToSheet(servidor),
    );
    return {
      sheet: "grupo_servidores_mesa" as const,
      rowNumber: existing?.rowNumber ?? snapshot.length + 1 + rowsToSave
        .slice(0, rowsToSave.indexOf(servidor))
        .filter((item) => !validRows.some((row) => row.data.grupo_servidor_mesa_id === item.grupo_servidor_mesa_id)).length,
      values,
    };
  });
  await commitGroupRows({
    writes,
  });

  return rowsToSave.filter((item) => item.ativo);
}

export async function saveGrupoServidorMesa(
  grupoId: string,
  input: Omit<
    GrupoServidorMesa,
    "grupo_servidor_mesa_id" | "grupo_id" | "created_at" | "updated_at"
  > &
    Partial<
      Pick<
        GrupoServidorMesa,
        "grupo_servidor_mesa_id" | "created_at" | "updated_at"
      >
    >,
  identity: Identity = defaultIdentity,
  authorization?: JsonValue,
) {
  requireAuthorization(authorization);
  const snapshot = await readSheetValues("grupo_servidores_mesa");
  const validRows = parseRows(
    "grupo_servidores_mesa",
    sheetGrupoServidorMesaSchema,
    groupAdminRowsToObjects("grupo_servidores_mesa", snapshot),
    sheetGrupoServidorMesaToDomain,
  ).filter(
    (row): row is ValidRow<GrupoServidorMesa> => row.valid,
  );
  const existing = input.grupo_servidor_mesa_id
    ? validRows.find(
        (row) =>
          row.data.grupo_servidor_mesa_id === input.grupo_servidor_mesa_id,
      )
    : undefined;
  if (input.grupo_servidor_mesa_id && !existing) {
    throw new Error("Servidor da mesa não encontrado.");
  }
  if (existing && existing.data.grupo_id !== grupoId) {
    throw new Error("Servidor da mesa não pertence ao grupo informado.");
  }
  const activeOrders = validRows
    .filter(
      (row) =>
        row.data.grupo_id === grupoId &&
        row.data.ativo &&
        row.data.grupo_servidor_mesa_id !== existing?.data.grupo_servidor_mesa_id,
    )
    .map((row) => row.data.ordem);
  const ordem =
    !existing && activeOrders.includes(input.ordem)
      ? Math.max(0, ...activeOrders) + 1
      : input.ordem;
  const timestamp = identity.now();
  const servidor: GrupoServidorMesa = {
    ...input,
    grupo_servidor_mesa_id:
      input.grupo_servidor_mesa_id ?? identity.uuid(),
    grupo_id: grupoId,
    ordem,
    created_at: input.created_at ?? existing?.data.created_at ?? timestamp,
    updated_at: timestamp,
  };
  const values = rowValues(
    "grupo_servidores_mesa",
    domainGrupoServidorMesaToSheet(servidor),
  );
  await commitGroupRows({
    writes: [{ sheet: "grupo_servidores_mesa", rowNumber: existing?.rowNumber ?? snapshot.length + 1, values }],
  });
  return servidor;
}

export async function deactivateGrupoServidorMesa(
  grupoId: string,
  servidorId: string,
  identity: Identity = defaultIdentity,
  authorization?: JsonValue,
) {
  requireAuthorization(authorization);
  const snapshot = await readSheetValues("grupo_servidores_mesa");
  const existing = parseRows(
    "grupo_servidores_mesa",
    sheetGrupoServidorMesaSchema,
    groupAdminRowsToObjects("grupo_servidores_mesa", snapshot),
    sheetGrupoServidorMesaToDomain,
  ).find(
    (row): row is ValidRow<GrupoServidorMesa> =>
      row.valid && row.data.grupo_servidor_mesa_id === servidorId,
  );
  if (!existing || existing.data.grupo_id !== grupoId) {
    throw new Error("Servidor da mesa não encontrado.");
  }
  const servidor = {
    ...existing.data,
    ativo: false,
    updated_at: identity.now(),
  };
  const values = rowValues(
    "grupo_servidores_mesa",
    domainGrupoServidorMesaToSheet(servidor),
  );
  await commitGroupRows({
    writes: [{ sheet: "grupo_servidores_mesa", rowNumber: existing.rowNumber, values }],
  });
  return servidor;
}

export async function deleteGrupoHorarios(
  horarioIds: string[],
  grupoId: string,
  authorization: JsonValue,
) {
  requireAuthorization(authorization);
  const ids = new Set(horarioIds.filter(Boolean));
  if (ids.size === 0) return;

  const snapshot = await readSheetValues("grupo_horarios");
  const rowNumbers = parseRows(
    "grupo_horarios",
    sheetGrupoHorarioSchema,
    groupAdminRowsToObjects("grupo_horarios", snapshot),
    sheetGrupoHorarioToDomain,
  )
    .filter(
      (row): row is ValidRow<GrupoHorario> =>
        row.valid && ids.has(row.data.horario_id),
    )
    .map((row) => row.rowNumber)
    .sort((first, second) => second - first);
  if (rowNumbers.length === 0) return;

  await commitGroupRows({
    deletes: rowNumbers.map((rowNumber) => ({ sheet: "grupo_horarios" as const, rowNumber })),
  });
}
