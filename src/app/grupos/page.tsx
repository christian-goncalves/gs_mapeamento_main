import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/require-session";
import { readAggregatedAtas } from "@/lib/sheets/repository";
import { GroupListActions } from "./group-list-actions";

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  await requireAdminSession();
  const result = await readAggregatedAtas();
  const groups = [...result.grupos].sort(
    (first, second) => first.grupo_nome.localeCompare(second.grupo_nome, "pt-BR"),
  );

  return (
    <main className="shell">
      <header className="section-heading">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Grupos</h1>
        </div>
        <Link className="button-link" href="/grupos/novo">Novo grupo</Link>
      </header>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Status</th>
                <th>Horários ativos</th>
                <th>E-mail de login</th>
                <th>Responsável</th>
                <th>E-mail responsável</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const activeSchedules = result.grupo_horarios.filter(
                  (schedule) =>
                    schedule.grupo_id === group.grupo_id && schedule.ativo,
                ).length;
                return (
                  <tr key={group.grupo_id}>
                    <td>{group.grupo_nome}</td>
                    <td>{group.ativo ? "Ativo" : "Inativo"}</td>
                    <td>{activeSchedules}</td>
                    <td>{group.email_acesso_grupo || "-"}</td>
                    <td>{group.responsavel_grupo_nome || "-"}</td>
                    <td>{group.responsavel_grupo_email || "-"}</td>
                    <td>
                      <GroupListActions
                        grupoId={group.grupo_id}
                        grupoNome={group.grupo_nome}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
