import "server-only";

import { randomBytes } from "node:crypto";
import type { Grupo } from "@/domain/entities";

export function createAtaLinkToken() {
  return randomBytes(32).toString("hex");
}

export function uniqueAtaLinkToken(
  groups: readonly Grupo[],
  currentGroupId: string,
) {
  const used = new Set(
    groups
      .filter((group) => group.grupo_id !== currentGroupId)
      .map((group) => group.link_formulario_ata)
      .filter(Boolean),
  );
  let token = createAtaLinkToken();
  while (used.has(token)) token = createAtaLinkToken();
  return token;
}
