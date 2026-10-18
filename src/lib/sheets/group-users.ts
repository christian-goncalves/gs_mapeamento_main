import "server-only";

import { randomUUID } from "node:crypto";
import type { Grupo, UsuarioGrupo } from "@/domain/entities";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { SHEET_HEADERS } from "./contract";
import { rowsToCompatibleObjects, sheetReadRange } from "./contract-v2";
import { executeSheetsBatch, buildCellUpdateRequest } from "./write";
import {
  parseRows,
  type ParsedRow,
  type SheetCell,
} from "./rows";
import {
  domainUsuarioGrupoToSheet,
  sheetUsuarioGrupoSchema,
  sheetUsuarioGrupoToDomain,
} from "./schemas";

type ValidRow<T> = Extract<ParsedRow<T>, { valid: true }>;

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLocaleLowerCase("en-US") ?? "";
}

function now() {
  return new Date().toISOString();
}

function activationExpiration() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString();
}

function passwordResetExpiration() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

export function isActivationInviteExpired(expiration: string) {
  return !expiration || new Date(expiration).getTime() < Date.now();
}

async function readSheetValues() {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: sheetReadRange("usuarios_grupo"),
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });
  return (response.data.values as SheetCell[][] | undefined) ?? [];
}

function rowValues(row: Record<string, SheetCell>) {
  return SHEET_HEADERS.usuarios_grupo.map((header) => row[header] ?? "");
}

async function sheetId() {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
    fields: "sheets(properties(sheetId,title))",
  });
  const id = response.data.sheets?.find(
    (sheet) => sheet.properties?.title === "usuarios_grupo",
  )?.properties?.sheetId;
  if (!Number.isInteger(id) || id == null) {
    throw new Error("Aba não encontrada: usuarios_grupo.");
  }
  return id;
}

export async function listGroupUsers(): Promise<ParsedRow<UsuarioGrupo>[]> {
  try {
    return parseRows(
      "usuarios_grupo",
      sheetUsuarioGrupoSchema,
      rowsToCompatibleObjects("usuarios_grupo", await readSheetValues()),
      sheetUsuarioGrupoToDomain,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unable to parse range: usuarios_grupo!")
    ) {
      return [];
    }
    throw error;
  }
}

async function validGroupUsers() {
  const rows = await listGroupUsers();
  return rows.filter((row): row is ValidRow<UsuarioGrupo> => row.valid);
}

async function saveUsuarioGrupo(
  input: Omit<UsuarioGrupo, "created_at" | "updated_at"> &
    Partial<Pick<UsuarioGrupo, "created_at" | "updated_at">>,
  authorization: Record<string, string>,
) {
  if (!authorization.kind) {
    throw new Error("Contexto de autorização da gravação ausente.");
  }
  const snapshot = await readSheetValues();
  const rows = parseRows(
    "usuarios_grupo",
    sheetUsuarioGrupoSchema,
    rowsToCompatibleObjects("usuarios_grupo", snapshot),
    sheetUsuarioGrupoToDomain,
  ).filter((row): row is ValidRow<UsuarioGrupo> => row.valid);
  const existing = rows.find((row) => row.data.usuario_id === input.usuario_id);
  const timestamp = now();
  const user: UsuarioGrupo = {
    ...input,
    email: normalizeEmail(input.email),
    created_at: input.created_at ?? existing?.data.created_at ?? timestamp,
    updated_at: timestamp,
  };
  const values = rowValues(domainUsuarioGrupoToSheet(user));
  const request = buildCellUpdateRequest(
    await sheetId(),
    existing?.rowNumber ?? snapshot.length + 1,
    values.map((value) => (value == null ? "" : value)),
  );
  await executeSheetsBatch([request]);
  return user;
}

export async function syncResponsibleGroupUser(group: Grupo, actorEmail: string) {
  const email = normalizeEmail(group.email_acesso_grupo);
  if (!email) return null;

  const users = await validGroupUsers();
  const existing = users.find((row) => row.data.grupo_id === group.grupo_id);
  const sameEmail = existing?.data.email === email;
  const alreadyActive = sameEmail && existing?.data.status === "ativo";
  const alreadyPending = sameEmail && existing?.data.status === "pendente";
  const inviteCreated = !alreadyActive && !alreadyPending;
  const user = await saveUsuarioGrupo({
    usuario_id: existing?.data.usuario_id ?? randomUUID(),
    grupo_id: group.grupo_id,
    email,
    nome: group.responsavel_grupo_nome,
    senha_hash: alreadyActive ? existing.data.senha_hash : "",
    status: alreadyActive ? "ativo" : "pendente",
    convite_token: alreadyActive
      ? ""
      : alreadyPending
        ? existing.data.convite_token
        : randomUUID(),
    convite_expira_em: alreadyActive
      ? ""
      : alreadyPending
        ? existing.data.convite_expira_em
        : activationExpiration(),
    ultimo_login: existing?.data.ultimo_login ?? "",
    created_at: existing?.data.created_at,
  }, { kind: "authenticated", email: normalizeEmail(actorEmail) });
  return { ...user, inviteCreated };
}

export async function getPendingActivationByToken(token: string) {
  if (!token) return null;
  const users = await validGroupUsers();
  const row = users.find(
    (item) =>
      item.data.status === "pendente" &&
      item.data.convite_token === token &&
      Boolean(item.data.convite_expira_em) &&
      !isActivationInviteExpired(item.data.convite_expira_em),
  );
  return row?.data ?? null;
}

export async function activateGroupUser(token: string, password: string) {
  const user = await getPendingActivationByToken(token);
  if (!user) return null;
  return saveUsuarioGrupo({
    ...user,
    senha_hash: await hashPassword(password),
    status: "ativo",
    convite_token: "",
    convite_expira_em: "",
  }, { kind: "activation_token", token, usuario_id: user.usuario_id });
}

export async function validateGroupCredentials(
  email: string,
  password: string,
) {
  const normalized = normalizeEmail(email);
  if (!normalized || !password) return null;
  const users = await validGroupUsers();
  const row = users.find(
    (item) =>
      item.data.email === normalized &&
      item.data.status === "ativo" &&
      Boolean(item.data.senha_hash),
  );
  if (!row || !(await verifyPassword(password, row.data.senha_hash))) return null;
  await saveUsuarioGrupo({ ...row.data, ultimo_login: now() }, { kind: "validated_login", usuario_id: row.data.usuario_id });
  return row.data;
}

export async function createPasswordResetForGroupUser(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const users = await validGroupUsers();
  const row = users.find(
    (item) => item.data.email === normalized && item.data.status === "ativo",
  );
  if (!row) return null;
  return saveUsuarioGrupo({
    ...row.data,
    convite_token: randomUUID(),
    convite_expira_em: passwordResetExpiration(),
  }, { kind: "password_recovery", usuario_id: row.data.usuario_id });
}

export async function getPasswordResetByToken(token: string) {
  if (!token) return null;
  const users = await validGroupUsers();
  const row = users.find(
    (item) =>
      item.data.status === "ativo" &&
      item.data.convite_token === token &&
      Boolean(item.data.convite_expira_em) &&
      new Date(item.data.convite_expira_em).getTime() >= Date.now(),
  );
  return row?.data ?? null;
}

export async function resetGroupUserPassword(token: string, password: string) {
  const user = await getPasswordResetByToken(token);
  if (!user) return null;
  return saveUsuarioGrupo({
    ...user,
    senha_hash: await hashPassword(password),
    convite_token: "",
    convite_expira_em: "",
  }, { kind: "password_reset_token", token, usuario_id: user.usuario_id });
}

export async function getPendingActivationForGroup(grupoId: string) {
  const users = await validGroupUsers();
  return (
    users.find(
      (row) =>
        row.data.grupo_id === grupoId &&
        row.data.status === "pendente" &&
        row.data.convite_token,
    )?.data ?? null
  );
}

export async function rotatePendingActivationForGroup(grupoId: string, actorEmail: string) {
  const users = await validGroupUsers();
  const existing = users.find(
    (row) =>
      row.data.grupo_id === grupoId &&
      row.data.status === "pendente" &&
      Boolean(row.data.convite_token),
  );
  if (!existing) return null;

  return saveUsuarioGrupo({
    ...existing.data,
    senha_hash: "",
    convite_token: randomUUID(),
    convite_expira_em: activationExpiration(),
  }, { kind: "authenticated", email: normalizeEmail(actorEmail) });
}
