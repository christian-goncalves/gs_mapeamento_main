import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faFilePdf,
  faFileCirclePlus,
  faLayerGroup,
  faPenToSquare,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { signOut } from "@/auth";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { readAggregatedAtas } from "@/lib/sheets/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { access } = await requireAuthorizedSession();
  const result = await readAggregatedAtas();
  const allowedGroupIds = new Set(access.groups.map((group) => group.grupo_id));
  const activeGroups = result.grupos
    .filter((group) => group.ativo && allowedGroupIds.has(group.grupo_id))
    .sort((first, second) => first.grupo_nome.localeCompare(second.grupo_nome, "pt-BR"));
  const atas = result.atas.filter(({ grupo }) => allowedGroupIds.has(grupo.grupo_id));
  const pageTitle = activeGroups.length === 1 ? activeGroups[0].grupo_nome : "Grupos ativos";

  return (
    <main className="shell">
      <header className="header">
        <div className="header-title">
          <h1>{pageTitle}</h1>
          <Link
            className="button-link"
            href={access.role === "administrador" ? "/grupos" : "/meu-grupo"}
          >
            <span className="button-content">
              <FontAwesomeIcon icon={faLayerGroup} />
              Gerenciar
            </span>
          </Link>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit">
            <span className="button-content">
              <FontAwesomeIcon icon={faRightFromBracket} />
              Sair
            </span>
          </button>
        </form>
      </header>

      <div className="grid">
        <section className="card">
          <div className="section-heading">
            <h2>Grupos com acesso</h2>
          </div>
          <ol className="list">
            {activeGroups.map((group) => (
              <li key={group.grupo_id}>{group.grupo_nome}</li>
            ))}
          </ol>
        </section>

        <section className="card">
          <div className="section-heading">
            <h2>Atas válidas</h2>
            <Link className="button-link" href="/atas/nova">
              <span className="button-content">
                <FontAwesomeIcon icon={faFileCirclePlus} />
                Nova ata
              </span>
            </Link>
          </div>
          {atas.length === 0 ? (
            <p className="muted">Nenhuma ata válida cadastrada.</p>
          ) : (
            <ul className="list">
              {atas.map(({ grupo, registro }) => (
                <li key={registro.ata.ata_id}>
                  <div className="ata-record">
                    <div className="ata-record-main">
                      {activeGroups.length > 1 && (
                        <span className="muted">{grupo.grupo_nome}</span>
                      )}
                      <strong>{registro.ata.data_reuniao} às {registro.ata.hora_inicio}</strong>
                    </div>
                    <div className="row-actions ata-record-actions" aria-label="Ações da ata">
                      <Link
                        className="icon-button"
                        href={`/atas/${registro.ata.ata_id}`}
                        aria-label={`Visualizar ata de ${registro.ata.data_reuniao} às ${registro.ata.hora_inicio}`}
                        title="Visualizar"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Link>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Editar ata indisponível"
                        title="Editar será implementado na fase de ciclo de vida da ata"
                        disabled
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="PDF da ata indisponível"
                        title="PDF será implementado na fase de relatórios"
                        disabled
                      >
                        <FontAwesomeIcon icon={faFilePdf} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {result.diagnostics.length > 0 && (
        <section className="card diagnostics">
          <h2>Correções necessárias no Sheets</h2>
          <p className="muted">
            Estas linhas foram isoladas e não participam dos indicadores.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Aba</th>
                  <th>Linha</th>
                  <th>Campo</th>
                  <th>Problema</th>
                </tr>
              </thead>
              <tbody>
                {result.diagnostics.map((diagnostic, index) => (
                  <tr
                    key={`${diagnostic.sheet}:${diagnostic.rowNumber}:${diagnostic.field}:${index}`}
                  >
                    <td>{diagnostic.sheet}</td>
                    <td>{diagnostic.rowNumber}</td>
                    <td>{diagnostic.field}</td>
                    <td>{diagnostic.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
