import "server-only";

import { redirect } from "next/navigation";
import type { AggregatedRead } from "@/domain/aggregate";
import { hasRequiredMesaServers } from "@/domain/grupo-servidores-mesa";
import type { AppAccess } from "./access";
import { readAggregatedAtas } from "@/lib/sheets/repository";

export async function redirectIfResponsibleMesaServersIncomplete(
  access: AppAccess,
  result?: AggregatedRead,
) {
  if (access.role !== "responsavel_grupo") return;
  const data = result ?? (await readAggregatedAtas());
  const missingGroup = access.groups.find(
    (group) =>
      !hasRequiredMesaServers(data.grupo_servidores_mesa, group.grupo_id),
  );
  if (!missingGroup) return;
  redirect(`/grupos/${missingGroup.grupo_id}?status=servidores-mesa-required`);
}

