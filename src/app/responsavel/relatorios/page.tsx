import { redirect } from "next/navigation";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { ResponsavelShell } from "../responsavel-shell";

export const dynamic = "force-dynamic";

export default async function ResponsavelRelatoriosPage() {
  const { access } = await requireAuthorizedSession();
  if (access.role === "administrador") redirect("/admin/grupos");
  const [group] = access.groups;
  if (!group) redirect("/login");

  return (
    <ResponsavelShell activeSection="relatorios" settingsHref={`/grupos/${group.grupo_id}`}>
      <header className="responsavel-page-header">
        <div>
          <p className="eyebrow">Responsável</p>
          <h1>Relatórios</h1>
        </div>
      </header>

      <section className="card responsavel-placeholder-card">
        <p className="empty-state">Os relatórios do responsável serão implementados em etapa futura.</p>
      </section>
    </ResponsavelShell>
  );
}
