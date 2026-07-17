import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/require-session";
import { readAggregatedAtas } from "@/lib/sheets/repository";
import { AdminGroupsPanel } from "./admin-groups-panel";
import { AdminShell } from "./admin-shell";

export const dynamic = "force-dynamic";

type GruposPageProps = {
  searchParams?: Promise<{
    status?: string | string[];
  }>;
};

export default async function GruposPage({ searchParams }: GruposPageProps) {
  await requireAdminSession();
  const params = await searchParams;
  const status = Array.isArray(params?.status)
    ? params.status[0]
    : params?.status;
  const result = await readAggregatedAtas();
  const groups = [...result.grupos].sort(
    (first, second) => first.grupo_nome.localeCompare(second.grupo_nome, "pt-BR"),
  ).map((group) => ({
    grupo_id: group.grupo_id,
    grupo_nome: group.grupo_nome,
    ativo: group.ativo,
    created_at: group.created_at,
    email_acesso_grupo: group.email_acesso_grupo,
    responsavel_grupo_nome: group.responsavel_grupo_nome,
    responsavel_grupo_email: group.responsavel_grupo_email,
    activeSchedules: result.grupo_horarios.filter(
      (schedule) => schedule.grupo_id === group.grupo_id && schedule.ativo,
    ).length,
  }));

  return (
    <AdminShell>
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Administração de grupos</h1>
        </div>
        <Link className="button-link" href="/grupos/novo">Novo grupo</Link>
      </header>

      <AdminGroupsPanel groups={groups} status={status} />
    </AdminShell>
  );
}
