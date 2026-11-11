import { notFound } from "next/navigation";
import { requireAdminSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { AdminShell } from "@/app/grupos/admin-shell";
import { MesaServersHistory } from "@/app/grupos/mesa-servers-history";

export const dynamic = "force-dynamic";

export default async function AdminMesaHistoryPage({
  params,
}: {
  params: Promise<{ grupoId: string }>;
}) {
  const { grupoId } = await params;
  const { result } = await requireAdminSessionWithAggregatedAtas();
  const group = result.grupos.find((item) => item.grupo_id === grupoId);
  if (!group) notFound();
  return (
    <AdminShell activeSection="grupos">
      <MesaServersHistory
        grupoId={grupoId}
        settingsHref={`/admin/grupos/${grupoId}?settingsSection=servers`}
        servidores={result.grupo_servidores_mesa.filter((item) => item.grupo_id === grupoId)}
      />
    </AdminShell>
  );
}
