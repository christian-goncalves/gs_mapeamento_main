import "server-only";

import { randomUUID } from "node:crypto";
import type { Grupo, GrupoHorario, GrupoPlataforma, GrupoServidorMesa, UsuarioGrupo } from "@/domain/entities";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { SHEET_HEADERS, type SheetName } from "./contract";
import { groupPlatformRowsToObjects, rowsToCompatibleObjects, rowsToVersionedObjects, sheetReadRange, V2_NEW_SHEET_HEADERS } from "./contract-v2";
import { executeSheetsBatch, buildCellUpdateRequest } from "./write";
import { parseRows, type ParsedRow, type SheetCell } from "./rows";
import {
  domainGrupoHorarioToSheet,
  domainGrupoPlataformaToSheet,
  domainGrupoServidorMesaToSheet,
  domainGrupoToSheet,
  domainUsuarioGrupoToSheet,
  sheetGrupoHorarioSchema,
  sheetGrupoHorarioToDomain,
  sheetGrupoPlataformaSchema,
  sheetGrupoPlataformaToDomain,
  sheetGrupoServidorMesaSchema,
  sheetGrupoServidorMesaToDomain,
  sheetGrupoSchema,
  sheetGrupoToDomain,
  sheetUsuarioGrupoSchema,
  sheetUsuarioGrupoToDomain,
} from "./schemas";

type ValidRow<T> = Extract<ParsedRow<T>, { valid: true }>;
type AdminSheetName = SheetName | "grupo_plataformas";
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

async function readSheet(name: AdminSheetName) {
  const values = await readSheetValues(name);
  return groupAdminRowsToObjects(name, values);
}

async function readOptionalSheet(name: AdminSheetName) {
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
  name: AdminSheetName,
  values: SheetCell[][],
) {
  if (name === "grupo_plataformas") return groupPlatformRowsToObjects(values);
  if (name === "grupo_horarios") return rowsToVersionedObjects(name, values);
  return rowsToCompatibleObjects(
    name,
    values,
    name === "grupos" ? { allowMissingTrailingHeaders: 3 } : undefined,
  );
}

async function readSheetValues(name: AdminSheetName) {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: name === "grupo_plataformas" ? "grupo_plataformas!A:I" : sheetReadRange(name),
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });
  return (response.data.values as SheetCell[][] | undefined) ?? [];
}

function rowValues<T extends Record<string, SheetCell>>(
  sheet: AdminSheetName,
  row: T,
  headers: readonly string[] = sheet === "grupo_plataformas" ? V2_NEW_SHEET_HEADERS.grupo_plataformas : SHEET_HEADERS[sheet],
) {
  return headers.map((header) => row[header] ?? "");
}

async function sheetIdByName(name: AdminSheetName) {
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
  writes?: { sheet: AdminSheetName; rowNumber: number; values: SheetCell[] }[];
  deletes?: { sheet: AdminSheetName; rowNumber: number }[];
}) {
  const writes = input.writes ?? [];
  const deletes = input.deletes ?? [];
  if (writes.length === 0 && deletes.length === 0) return;
  const names = [...new Set([...writes.map((item) => item.sheet), ...deletes.map((item) => item.sheet)])];
  const ids = Object.fromEntries(await Promise.all(names.map(async (name) => [name, await sheetIdByName(name)]))) as Partial<Record<AdminSheetName, number>>;
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
  const [grupoRows, horarioRows, plataformaRows, servidorMesaRows] = await Promise.all([
    readSheet("grupos"),
    readSheet("grupo_horarios"),
    readOptionalSheet("grupo_plataformas"),
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
    grupo_plataformas: parseRows("grupo_plataformas", sheetGrupoPlataformaSchema, plataformaRows, sheetGrupoPlataformaToDomain),
    grupo_servidores_mesa: parseRows(
      "grupo_servidores_mesa",
      sheetGrupoServidorMesaSchema,
      servidorMesaRows,
      sheetGrupoServidorMesaToDomain,
    ),
  };
}

export async function saveGrupoPlataforma(
  input: Omit<GrupoPlataforma, "plataforma_id" | "created_at" | "updated_at"> & Partial<Pick<GrupoPlataforma, "plataforma_id" | "created_at" | "updated_at">>,
  identity: Identity = defaultIdentity,
  authorization?: JsonValue,
) {
  requireAuthorization(authorization);
  const [platformSnapshot, groupSnapshot] = await Promise.all([
    readSheetValues("grupo_plataformas"),
    readSheetValues("grupos"),
  ]);
  const platforms = parseRows("grupo_plataformas", sheetGrupoPlataformaSchema, groupAdminRowsToObjects("grupo_plataformas", platformSnapshot), sheetGrupoPlataformaToDomain).filter((row): row is ValidRow<GrupoPlataforma> => row.valid);
  const groups = parseRows("grupos", sheetGrupoSchema, groupAdminRowsToObjects("grupos", groupSnapshot), sheetGrupoToDomain).filter((row): row is ValidRow<Grupo> => row.valid);
  if (!groups.some((row) => row.data.grupo_id === input.grupo_id && row.data.ativo)) throw new Error("Grupo inexistente ou inativo.");
  const existing = input.plataforma_id ? platforms.find((row) => row.data.plataforma_id === input.plataforma_id) : undefined;
  if (input.plataforma_id && !existing) throw new Error("Plataforma não encontrada.");
  if (existing && existing.data.grupo_id !== input.grupo_id) throw new Error("Plataforma não pertence ao grupo informado.");
  if (input.ativo && platforms.some((row) => row.data.ativo && row.data.grupo_id === input.grupo_id && row.data.tipo === input.tipo && row.data.plataforma_id !== input.plataforma_id)) throw new Error("Já existe uma plataforma ativa deste tipo para o grupo.");
  const timestamp = identity.now();
  const platform: GrupoPlataforma = { ...input, plataforma_id: input.plataforma_id ?? identity.uuid(), created_at: input.created_at ?? existing?.data.created_at ?? timestamp, updated_at: timestamp };
  await commitGroupRows({ writes: [{ sheet: "grupo_plataformas", rowNumber: existing?.rowNumber ?? platformSnapshot.length + 1, values: rowValues("grupo_plataformas", domainGrupoPlataformaToSheet(platform)) }] });
  return platform;
}

export async function setGrupoHorarioPlataformas(
  grupoId: string,
  assignments: { horario_id: string; plataforma_id: string }[],
  identity: Identity = defaultIdentity,
  authorization?: JsonValue,
) {
  requireAuthorization(authorization);
  if (new Set(assignments.map((item) => item.horario_id)).size !== assignments.length) throw new Error("Um horário não pode aparecer mais de uma vez na distribuição.");
  const [horarioSnapshot, platformSnapshot] = await Promise.all([readSheetValues("grupo_horarios"), readSheetValues("grupo_plataformas")]);
  const horarios = parseRows("grupo_horarios", sheetGrupoHorarioSchema, groupAdminRowsToObjects("grupo_horarios", horarioSnapshot), sheetGrupoHorarioToDomain).filter((row): row is ValidRow<GrupoHorario> => row.valid);
  const platforms = parseRows("grupo_plataformas", sheetGrupoPlataformaSchema, groupAdminRowsToObjects("grupo_plataformas", platformSnapshot), sheetGrupoPlataformaToDomain).filter((row): row is ValidRow<GrupoPlataforma> => row.valid);
  const platformById = new Map(platforms.filter((row) => row.data.ativo && row.data.grupo_id === grupoId).map((row) => [row.data.plataforma_id, row]));
  if (!(horarioSnapshot[0] ?? []).includes("plataforma_id")) throw new Error("A coluna plataforma_id ainda não existe em grupo_horarios. A associação local foi cancelada sem gravar.");
  const writes = assignments.map((assignment) => {
    const schedule = horarios.find((row) => row.data.horario_id === assignment.horario_id);
    const platform = platformById.get(assignment.plataforma_id);
    if (!schedule || !schedule.data.ativo || schedule.data.grupo_id !== grupoId) throw new Error("Horário inexistente, inativo ou de outro grupo.");
    if (!platform) throw new Error("A plataforma precisa estar ativa e pertencer ao grupo.");
    const next = { ...schedule.data, plataforma_id: platform.data.plataforma_id, updated_at: identity.now() };
    return { sheet: "grupo_horarios" as const, rowNumber: schedule.rowNumber, values: rowValues("grupo_horarios", domainGrupoHorarioToSheet(next), compatibleScheduleHeaders(horarioSnapshot)) };
  });
  await commitGroupRows({ writes });
}

function compatibleScheduleHeaders(snapshot: SheetCell[][]) {
  return snapshot[0]?.map(String) ?? SHEET_HEADERS.grupo_horarios;
}

export async function deactivateGrupoPlataforma(
  grupoId: string,
  plataformaId: string,
  transferToPlataformaId: string | undefined,
  identity: Identity = defaultIdentity,
  authorization?: JsonValue,
) {
  requireAuthorization(authorization);
  const [platformSnapshot, scheduleSnapshot] = await Promise.all([readSheetValues("grupo_plataformas"), readSheetValues("grupo_horarios")]);
  const platforms = parseRows("grupo_plataformas", sheetGrupoPlataformaSchema, groupAdminRowsToObjects("grupo_plataformas", platformSnapshot), sheetGrupoPlataformaToDomain).filter((row): row is ValidRow<GrupoPlataforma> => row.valid);
  const schedules = parseRows("grupo_horarios", sheetGrupoHorarioSchema, groupAdminRowsToObjects("grupo_horarios", scheduleSnapshot), sheetGrupoHorarioToDomain).filter((row): row is ValidRow<GrupoHorario> => row.valid);
  const source = platforms.find((row) => row.data.plataforma_id === plataformaId && row.data.grupo_id === grupoId && row.data.ativo);
  const target = platforms.find((row) => row.data.plataforma_id === transferToPlataformaId && row.data.grupo_id === grupoId && row.data.ativo);
  if (!source) throw new Error("Plataforma não encontrada ou inativa.");
  const affected = schedules.filter((row) => row.data.ativo && row.data.grupo_id === grupoId && row.data.plataforma_id === plataformaId);
  if (affected.length && (!target || source.data.plataforma_id === target.data.plataforma_id)) throw new Error("Informe uma plataforma ativa do mesmo grupo para transferir os horários.");
  if (affected.length && !(scheduleSnapshot[0] ?? []).includes("plataforma_id")) throw new Error("A coluna plataforma_id ainda não existe em grupo_horarios. A transferência foi cancelada sem gravar.");
  const writes: { sheet: AdminSheetName; rowNumber: number; values: SheetCell[] }[] = affected.map((row) => ({ sheet: "grupo_horarios", rowNumber: row.rowNumber, values: rowValues("grupo_horarios", domainGrupoHorarioToSheet({ ...row.data, plataforma_id: target!.data.plataforma_id, updated_at: identity.now() }), compatibleScheduleHeaders(scheduleSnapshot)) }));
  writes.push({ sheet: "grupo_plataformas" as const, rowNumber: source.rowNumber, values: rowValues("grupo_plataformas", domainGrupoPlataformaToSheet({ ...source.data, ativo: false, updated_at: identity.now() })) });
  await commitGroupRows({ writes });
  return { platform: { ...source.data, ativo: false }, transferredScheduleIds: affected.map((row) => row.data.horario_id) };
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

function normalizeGroupLoginEmail(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

export async function confirmGroupLoginEmailChange(input: {
  grupo_id: string;
  currentEmail: string;
  nextEmail: string;
}, identity: Identity = defaultIdentity, authorization?: JsonValue) {
  requireAuthorization(authorization);
  const [groupSnapshot, userSnapshot] = await Promise.all([
    readSheetValues("grupos"),
    readSheetValues("usuarios_grupo"),
  ]);
  const groups = parseRows(
    "grupos",
    sheetGrupoSchema,
    groupAdminRowsToObjects("grupos", groupSnapshot),
    sheetGrupoToDomain,
  ).filter((row): row is ValidRow<Grupo> => row.valid);
  const users = parseRows(
    "usuarios_grupo",
    sheetUsuarioGrupoSchema,
    groupAdminRowsToObjects("usuarios_grupo", userSnapshot),
    sheetUsuarioGrupoToDomain,
  ).filter((row): row is ValidRow<UsuarioGrupo> => row.valid);
  const currentEmail = normalizeGroupLoginEmail(input.currentEmail);
  const nextEmail = normalizeGroupLoginEmail(input.nextEmail);
  const group = groups.find((row) => row.data.grupo_id === input.grupo_id);

  if (!group || !group.data.ativo || normalizeGroupLoginEmail(group.data.email_acesso_grupo) !== currentEmail) {
    throw new Error("A solicitação de alteração de e-mail expirou ou não corresponde ao acesso atual.");
  }
  if (groups.some((row) => row.data.grupo_id !== input.grupo_id && normalizeGroupLoginEmail(row.data.email_acesso_grupo) === nextEmail)) {
    throw new Error("Este e-mail já está associado a outro grupo.");
  }

  const user = users.find((row) => row.data.grupo_id === input.grupo_id && normalizeGroupLoginEmail(row.data.email) === currentEmail && row.data.status === "ativo");
  if (!user) throw new Error("Não foi encontrado um usuário ativo para este grupo.");
  if (users.some((row) => row.data.usuario_id !== user.data.usuario_id && normalizeGroupLoginEmail(row.data.email) === nextEmail)) {
    throw new Error("Este e-mail já está associado a outro acesso.");
  }

  const timestamp = identity.now();
  const updatedGroup: Grupo = {
    ...group.data,
    email_acesso_grupo: nextEmail,
    updated_at: timestamp,
  };
  const updatedUser: UsuarioGrupo = {
    ...user.data,
    email: nextEmail,
    convite_token: "",
    convite_expira_em: "",
    updated_at: timestamp,
  };
  await commitGroupRows({
    writes: [
      {
        sheet: "grupos",
        rowNumber: group.rowNumber,
        values: rowValues("grupos", domainGrupoToSheet(updatedGroup), groupSnapshot[0]?.map(String) ?? SHEET_HEADERS.grupos),
      },
      {
        sheet: "usuarios_grupo",
        rowNumber: user.rowNumber,
        values: rowValues("usuarios_grupo", domainUsuarioGrupoToSheet(updatedUser), userSnapshot[0]?.map(String) ?? SHEET_HEADERS.usuarios_grupo),
      },
    ],
  });
  return { group: updatedGroup, user: updatedUser };
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
  if (input.plataforma_id) {
    const platformSnapshot = await readSheetValues("grupo_plataformas");
    const platforms = parseRows("grupo_plataformas", sheetGrupoPlataformaSchema, groupAdminRowsToObjects("grupo_plataformas", platformSnapshot), sheetGrupoPlataformaToDomain).filter((row): row is ValidRow<GrupoPlataforma> => row.valid);
    if (!platforms.some((row) => row.data.plataforma_id === input.plataforma_id && row.data.grupo_id === input.grupo_id && row.data.ativo)) throw new Error("A plataforma precisa estar ativa e pertencer ao mesmo grupo do horário.");
    if (!(snapshot[0] ?? []).includes("plataforma_id")) throw new Error("A coluna plataforma_id ainda não existe em grupo_horarios.");
  }
  const horario: GrupoHorario = {
    ...input,
    horario_id: input.horario_id ?? identity.uuid(),
    created_at: input.created_at ?? existing?.data.created_at ?? timestamp,
    updated_at: timestamp,
  };
  const values = rowValues(
    "grupo_horarios",
    domainGrupoHorarioToSheet(horario),
    snapshot[0]?.map(String) ?? SHEET_HEADERS.grupo_horarios,
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

export async function saveGrupoHorarioSet(
  grupoId: string,
  inputs: {
    horario_id?: string;
    dia_semana: GrupoHorario["dia_semana"];
    hora_inicio: GrupoHorario["hora_inicio"];
    plataforma_id?: string;
  }[],
  identity: Identity = defaultIdentity,
  authorization?: JsonValue,
) {
  requireAuthorization(authorization);
  if (inputs.length === 0) throw new Error("Informe pelo menos um horário.");

  const keys = inputs.map((item) => `${item.dia_semana}:${item.hora_inicio}`);
  if (new Set(keys).size !== keys.length) {
    throw new Error("Existem horários duplicados. Revise dia e hora antes de salvar.");
  }

  const [scheduleSnapshot, platformSnapshot] = await Promise.all([
    readSheetValues("grupo_horarios"),
    readSheetValues("grupo_plataformas"),
  ]);
  const scheduleHeaders = scheduleSnapshot[0]?.map(String) ?? SHEET_HEADERS.grupo_horarios;
  const schedules = parseRows(
    "grupo_horarios",
    sheetGrupoHorarioSchema,
    groupAdminRowsToObjects("grupo_horarios", scheduleSnapshot),
    sheetGrupoHorarioToDomain,
  ).filter((row): row is ValidRow<GrupoHorario> => row.valid);
  const platforms = parseRows(
    "grupo_plataformas",
    sheetGrupoPlataformaSchema,
    groupAdminRowsToObjects("grupo_plataformas", platformSnapshot),
    sheetGrupoPlataformaToDomain,
  ).filter((row): row is ValidRow<GrupoPlataforma> => row.valid);

  const groupSchedules = schedules.filter((row) => row.data.grupo_id === grupoId);
  const activePlatforms = platforms
    .filter((row) => row.data.grupo_id === grupoId && row.data.ativo)
    .map((row) => row.data);
  const schedulesById = new Map(groupSchedules.map((row) => [row.data.horario_id, row]));
  const schedulesByKey = new Map(
    groupSchedules.map((row) => [`${row.data.dia_semana}:${row.data.hora_inicio}`, row]),
  );
  const allSchedulesById = new Map(schedules.map((row) => [row.data.horario_id, row]));
  const activePlatformsById = new Map(activePlatforms.map((platform) => [platform.plataforma_id, platform]));
  const timestamp = identity.now();

  const resolved = inputs.map((input) => {
    const submittedId = input.horario_id ? allSchedulesById.get(input.horario_id) : undefined;
    if (submittedId && submittedId.data.grupo_id !== grupoId) {
      throw new Error("O horário informado não pertence a este grupo.");
    }
    const existing = (input.horario_id ? schedulesById.get(input.horario_id) : undefined)
      ?? schedulesByKey.get(`${input.dia_semana}:${input.hora_inicio}`);
    const plataformaId = existing?.data.plataforma_id
      ?? input.plataforma_id
      ?? (activePlatforms.length === 1 ? activePlatforms[0]?.plataforma_id : undefined);

    if (!existing && activePlatforms.length > 1 && !plataformaId) {
      throw new Error("Selecione e confirme a plataforma para cada novo horário.");
    }
    if (plataformaId && !activePlatformsById.has(plataformaId)) {
      throw new Error("A plataforma selecionada não pertence ao grupo ou está inativa.");
    }
    if (plataformaId && !scheduleHeaders.includes("plataforma_id")) {
      throw new Error("A coluna plataforma_id ainda não existe em grupo_horarios.");
    }

    const horario: GrupoHorario = {
      horario_id: existing?.data.horario_id ?? identity.uuid(),
      grupo_id: grupoId,
      dia_semana: input.dia_semana,
      hora_inicio: input.hora_inicio,
      link_reuniao: existing?.data.link_reuniao ?? "",
      plataforma_id: plataformaId,
      ativo: true,
      created_at: existing?.data.created_at ?? timestamp,
      updated_at: timestamp,
    };
    return { existing, horario };
  });

  const desiredIds = new Set(resolved.map(({ horario }) => horario.horario_id));
  const desiredKeys = new Set(keys);
  const deletes = groupSchedules
    .filter((row) => {
      const key = `${row.data.dia_semana}:${row.data.hora_inicio}`;
      return !desiredIds.has(row.data.horario_id) && !desiredKeys.has(key);
    })
    .map((row) => row.rowNumber)
    .sort((first, second) => second - first)
    .map((rowNumber) => ({ sheet: "grupo_horarios" as const, rowNumber }));
  let appendedRows = 0;
  const writes = resolved.map(({ existing, horario }) => {
    const rowNumber = existing?.rowNumber ?? scheduleSnapshot.length + 1 + appendedRows++;
    return {
    sheet: "grupo_horarios" as const,
    rowNumber,
    values: rowValues(
      "grupo_horarios",
      domainGrupoHorarioToSheet(horario),
      scheduleHeaders,
    ),
    };
  });

  await commitGroupRows({ writes, deletes });
  return resolved.map(({ horario }) => horario);
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
