import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/require-session";
import { requestOrigin } from "@/lib/http/request-origin";
import { ensureSecureAtaLinkToken } from "@/lib/sheets/ensure-ata-link-token";
import { getPendingActivationForGroup } from "@/lib/sheets/group-users";
import { readAggregatedAtas } from "@/lib/sheets/repository";
import { GroupEditor } from "@/app/grupos/group-editor";

export const dynamic = "force-dynamic";

export default async function AdminGroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ grupoId: string }>;
  searchParams?: Promise<{ status?: string }>;
}) {
  await requireAdminSession();
  const { grupoId } = await params;
  const status = (await searchParams)?.status;
  const result = await readAggregatedAtas();
  const group = result.grupos.find((item) => item.grupo_id === grupoId);
  if (!group) notFound();
  const groupWithSecureAtaLink = await ensureSecureAtaLinkToken(
    group,
    result.grupos,
  );
  const horarios = result.grupo_horarios.filter(
    (horario) => horario.grupo_id === grupoId,
  );
  const pendingActivation = await getPendingActivationForGroup(grupoId);
  const publicOrigin = requestOrigin(await headers());

  return (
    <GroupEditor
      group={groupWithSecureAtaLink}
      horarios={horarios}
      canCreate
      canManageAccess
      activationPath={
        pendingActivation
          ? `/ativar-acesso/${pendingActivation.convite_token}`
          : ""
      }
      status={status}
      publicOrigin={publicOrigin}
    />
  );
}
