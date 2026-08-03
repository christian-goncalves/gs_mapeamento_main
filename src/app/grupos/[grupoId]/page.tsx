import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { requireGroupSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { requestOrigin } from "@/lib/http/request-origin";
import { ensureSecureAtaLinkToken } from "@/lib/sheets/ensure-ata-link-token";
import { GroupEditor } from "../group-editor";
import { ResponsavelShell } from "@/app/responsavel/responsavel-shell";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ grupoId: string }>;
  searchParams?: Promise<{ status?: string }>;
}) {
  const { grupoId } = await params;
  const status = (await searchParams)?.status;
  const { access, result } = await requireGroupSessionWithAggregatedAtas(grupoId);
  if (access.role === "administrador") {
    redirect(
      status
        ? `/admin/grupos/${grupoId}?status=${encodeURIComponent(status)}`
        : `/admin/grupos/${grupoId}`,
    );
  }
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
  const publicOrigin = requestOrigin(await headers());
  return (
    <ResponsavelShell activeSection="configuracoes" settingsHref={`/grupos/${grupoId}`}>
      <GroupEditor
        group={groupWithSecureAtaLink}
        horarios={horarios}
        servidoresMesa={servidoresMesa}
        canCreate={false}
        canManageAccess={false}
        status={status}
        publicOrigin={publicOrigin}
        variant="responsavel"
      />
    </ResponsavelShell>
  );
}
