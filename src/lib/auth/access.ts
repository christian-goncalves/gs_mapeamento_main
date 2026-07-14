import "server-only";

import type { Grupo } from "@/domain/entities";
import { readAggregatedAtas } from "@/lib/sheets/repository";
import { listGroupUsers } from "@/lib/sheets/group-users";
import { isEmailAllowed } from "./allowed-emails";

export type AppAccess =
  | { role: "administrador"; email: string; groups: Grupo[] }
  | { role: "responsavel_grupo"; email: string; groups: Grupo[] };

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLocaleLowerCase("en-US") ?? "";
}

function emailMatches(email: string, candidate: string) {
  return Boolean(candidate) && normalizeEmail(candidate) === email;
}

export async function resolveAccessByEmail(
  email: string | null | undefined,
): Promise<AppAccess | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const result = await readAggregatedAtas();
  if (isEmailAllowed(normalized)) {
    return {
      role: "administrador",
      email: normalized,
      groups: result.grupos,
    };
  }

  const users = await listGroupUsers();
  const allowedGroupIds = new Set(
    users
      .filter(
        (row) =>
          row.valid &&
          row.data.status === "ativo" &&
          emailMatches(normalized, row.data.email),
      )
      .map((row) => (row.valid ? row.data.grupo_id : "")),
  );
  const groups = result.grupos.filter(
    (group) => group.ativo && allowedGroupIds.has(group.grupo_id),
  );
  if (groups.length === 0) return null;
  return {
    role: "responsavel_grupo",
    email: normalized,
    groups,
  };
}

export async function isAppEmailAllowed(email: string | null | undefined) {
  return Boolean(await resolveAccessByEmail(email));
}

export function canAccessGroup(access: AppAccess, grupoId: string) {
  return (
    access.role === "administrador" ||
    access.groups.some((group) => group.grupo_id === grupoId)
  );
}
