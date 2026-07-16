import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { listActiveGroupOptions } from "@/lib/sheets/repository";
import { AtaForm } from "./ata-form";

export const dynamic = "force-dynamic";

export default async function NewAtaPage() {
  const { access } = await requireAuthorizedSession();
  const allowedGroupIds = new Set(access.groups.map((group) => group.grupo_id));
  const groups = (await listActiveGroupOptions()).filter((group) =>
    allowedGroupIds.has(group.grupo_id),
  );
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return (
    <main className="shell form-shell">
      <Link className="back-link" href="/">
        <span className="button-content">
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar para atas
        </span>
      </Link>
      <header>
        <p className="eyebrow">Nova ata</p>
        <h1>Registrar reunião</h1>
        <p className="muted">O envio será imutável após a confirmação.</p>
      </header>
      {groups.length === 0 ? (
        <section className="card"><p>Nenhum grupo ativo disponível.</p></section>
      ) : (
        <AtaForm
          fixedGroupId={groups.length === 1 ? groups[0].grupo_id : undefined}
          groups={groups.map((group) => ({
            id: group.grupo_id,
            name: group.grupo_nome,
            horarios: group.horarios.map((horario) => ({
              dia_semana: horario.dia_semana,
              hora_inicio: horario.hora_inicio,
              link_reuniao: horario.link_reuniao,
            })),
          }))}
          today={today}
        />
      )}
    </main>
  );
}
