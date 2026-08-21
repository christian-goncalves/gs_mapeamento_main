import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireAdminSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { requestOrigin } from "@/lib/http/request-origin";
import { ensureSecureAtaLinkToken } from "@/lib/sheets/ensure-ata-link-token";
import {
  getPendingActivationForGroup,
  isActivationInviteExpired,
} from "@/lib/sheets/group-users";
import { GroupEditor } from "@/app/grupos/group-editor";

export const dynamic = "force-dynamic";

export default async function AdminGroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ grupoId: string }>;
  searchParams?: Promise<{ status?: string }>;
}) {
  const { result } = await requireAdminSessionWithAggregatedAtas();
  const { grupoId } = await params;
  const status = (await searchParams)?.status;
  const group = result.grupos.find((item) => item.grupo_id === grupoId);
  if (!group) notFound();
  const groupWithSecureAtaLink = await ensureSecureAtaLinkToken(
    group,
    result.grupos,
  );
  const horarios = result.grupo_horarios.filter(
    (horario) => horario.grupo_id === grupoId,
  );
  const servidoresMesa = result.grupo_servidores_mesa.filter(
    (servidor) => servidor.grupo_id === grupoId && servidor.ativo,
  );
  const pendingActivation = await getPendingActivationForGroup(grupoId);
  const publicOrigin = requestOrigin(await headers());

  return (
    <GroupEditor
      group={groupWithSecureAtaLink}
      horarios={horarios}
      servidoresMesa={servidoresMesa}
      canCreate
      canManageAccess
      activationPath={
        pendingActivation
          ? `${publicOrigin.replace(/\/$/, "")}/ativar-acesso/${pendingActivation.convite_token}`
          : ""
      }
      activationExpired={Boolean(
        pendingActivation &&
          isActivationInviteExpired(pendingActivation.convite_expira_em),
      )}
      status={status}
      publicOrigin={publicOrigin}
    />
  );
}
