import { signOut } from "@/auth";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { listAtas, listGroups } from "@/lib/sheets/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requireAuthorizedSession();
  const [groupRows, ataRows] = await Promise.all([listGroups(), listAtas()]);
  const allGroups = groupRows
    .filter((row) => row.valid)
    .map((row) => row.data);
  const groups = allGroups
    .filter((group) => group.ativo)
    .sort((first, second) => first.ordem - second.ordem);
  const groupNames = new Map(
    allGroups.map((group) => [group.grupo_id, group.grupo_nome]),
  );
  const validAtas = ataRows
    .filter((row) => row.valid)
    .map((row) => row.data)
    .sort((first, second) => second.data_reuniao.localeCompare(first.data_reuniao));
  const invalidAtas = ataRows.filter((row) => !row.valid);

  return (
    <main className="shell">
      <header className="header">
        <div>
          <h1>GS Mapeamento</h1>
          <span className="muted">{session.user?.email}</span>
        </div>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
          <button type="submit">Sair</button>
        </form>
      </header>
      <div className="grid">
        <section className="card">
          <h2>Grupos ativos</h2>
          <ol className="list">
            {groups.map((group) => <li key={group.grupo_id}>{group.grupo_nome}</li>)}
          </ol>
        </section>
        <section className="card">
          <h2>Atas</h2>
          {validAtas.length === 0 ? <p className="muted">Nenhuma ata cadastrada.</p> : (
            <ul className="list">
              {validAtas.map((ata) => (
                <li key={ata.ata_id}>
                  <strong>{groupNames.get(ata.grupo_id) ?? "Grupo inativo ou inválido"}</strong><br />
                  <span className="muted">{ata.data_reuniao} às {ata.hora_inicio}</span>
                </li>
              ))}
            </ul>
          )}
          {invalidAtas.length > 0 && (
            <p className="error">{invalidAtas.length} linha(s) inválida(s) no Sheets precisam de correção.</p>
          )}
        </section>
      </div>
    </main>
  );
}
