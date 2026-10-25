import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GroupEditor } from "@/app/grupos/group-editor";
import {
  requireAdminSession,
  requireAdminSessionWithAggregatedAtas,
} from "@/lib/auth/require-session";
import { getPendingActivationForGroup, isActivationInviteExpired } from "@/lib/sheets/group-users";
import { requestOrigin } from "@/lib/http/request-origin";

export const dynamic = "force-dynamic";

export default async function NewAdminGroupPage({
  searchParams,
}: {
  searchParams?: Promise<{ grupoId?: string; status?: string; settingsSection?: string }>;
}) {
  const { grupoId, status, settingsSection } = (await searchParams) ?? {};
  if (!grupoId) {
    await requireAdminSession();
    return <GroupEditor horarios={[]} canCreate />;
  }

  const { result } = await requireAdminSessionWithAggregatedAtas();
  const group = result.grupos.find((item) => item.grupo_id === grupoId);
  if (!group) notFound();

  const [pendingActivation, requestHeaders] = await Promise.all([
    getPendingActivationForGroup(grupoId),
    headers(),
  ]);
  const publicOrigin = requestOrigin(requestHeaders);

  return (
    <GroupEditor
      group={group}
      horarios={result.grupo_horarios.filter((horario) => horario.grupo_id === grupoId)}
      plataformas={result.grupo_plataformas.filter((platform) => platform.grupo_id === grupoId)}
      servidoresMesa={result.grupo_servidores_mesa.filter((item) => item.grupo_id === grupoId && item.ativo)}
      canCreate
      canManageAccess
      activationPath={pendingActivation ? `${publicOrigin.replace(/\/$/, "")}/ativar-acesso/${pendingActivation.convite_token}` : ""}
      activationExpired={Boolean(pendingActivation && isActivationInviteExpired(pendingActivation.convite_expira_em))}
      status={status}
      initialOpenSection={settingsSection}
      publicOrigin={publicOrigin}
      keepNewGroupRoute
    />
  );
}
