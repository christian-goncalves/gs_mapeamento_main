import "server-only";

import type { Grupo } from "@/domain/entities";
import { isSecureAtaLinkToken } from "@/lib/ata-link-token";
import { uniqueAtaLinkToken } from "@/lib/ata-link-token.server";
import { saveGrupo } from "./group-admin";

export async function ensureSecureAtaLinkToken(
  group: Grupo,
  groups: readonly Grupo[],
) {
  if (isSecureAtaLinkToken(group.link_formulario_ata)) return group;

  return saveGrupo({
    ...group,
    link_formulario_ata: uniqueAtaLinkToken(groups, group.grupo_id),
  }, undefined, { kind: "operational_link_repair" });
}
