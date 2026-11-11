import { notFound, redirect } from "next/navigation";
import { requireGroupSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { MesaServersHistory } from "@/app/grupos/mesa-servers-history";
import { ResponsavelShell } from "@/app/responsavel/responsavel-shell";

export const dynamic = "force-dynamic";

export default async function ResponsavelMesaHistoryPage({
  params,
}: {
  params: Promise<{ grupoId: string }>;
}) {
  const { grupoId } = await params;
  const { access, result } = await requireGroupSessionWithAggregatedAtas(grupoId);
  if (access.role === "administrador") {
    redirect(`/admin/grupos/${grupoId}/servidores/historico`);
  }
  const group = result.grupos.find((item) => item.grupo_id === grupoId);
  if (!group) notFound();
  return (
    <ResponsavelShell activeSection="configuracoes" settingsHref={`/grupos/${grupoId}`}>
      <MesaServersHistory
        grupoId={grupoId}
        settingsHref={`/grupos/${grupoId}?settingsSection=servers`}
        servidores={result.grupo_servidores_mesa.filter((item) => item.grupo_id === grupoId)}
      />
    </ResponsavelShell>
  );
}
