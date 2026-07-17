import Link from "next/link";
import { redirect } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faFileCirclePlus,
  faFileLines,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { readAggregatedAtas } from "@/lib/sheets/repository";
import { ResponsavelAtasTable, type ResponsavelAtaRow } from "./responsavel-atas-table";
import { ResponsavelShell } from "../responsavel-shell";

export const dynamic = "force-dynamic";

function currentMonthKey() {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).format(now);
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function primaryServerName(servers: { nome: string; ordem: number }[]) {
  return [...servers].sort((first, second) => first.ordem - second.ordem)[0]?.nome ?? "";
}

export default async function ResponsavelAtasPage() {
  const { access } = await requireAuthorizedSession();
  if (access.role === "administrador") redirect("/admin/grupos");
  const [group] = access.groups;
  if (!group) redirect("/login");

  const result = await readAggregatedAtas();
  const groupAtas = result.atas.filter(
    (item) => item.grupo.grupo_id === group.grupo_id,
  );
  const monthKey = currentMonthKey();
  const uniqueServers = new Set(
    groupAtas.flatMap((item) =>
      item.registro.servidores
        .map((server) => normalizeName(server.nome))
        .filter(Boolean),
    ),
  );
  const rows: ResponsavelAtaRow[] = groupAtas.map((item) => {
    const { ata } = item.registro;
    return {
      ataId: ata.ata_id,
      data: ata.data_reuniao,
      horario: ata.hora_inicio,
      servidor: primaryServerName(item.registro.servidores),
      status: "Enviada",
    };
  });

  return (
    <ResponsavelShell activeSection="atas" settingsHref={`/grupos/${group.grupo_id}`}>
      <header className="responsavel-page-header">
        <div>
          <p className="eyebrow">Responsável</p>
          <h1>GRUPO {group.grupo_nome.toLocaleUpperCase("pt-BR")}</h1>
        </div>
        <Link className="button-link" href="/atas/nova">
          <span className="button-content">
            <FontAwesomeIcon icon={faFileCirclePlus} />
            Nova ata
          </span>
        </Link>
      </header>

      <section className="summary-cards" aria-label="Resumo das atas do grupo">
        <dl className="summary-card">
          <span className="summary-icon summary-icon-active" aria-hidden="true">
            <FontAwesomeIcon icon={faFileLines} />
          </span>
          <div>
            <dt>Atas</dt>
            <dd>{groupAtas.length}</dd>
          </div>
        </dl>
        <dl className="summary-card">
          <span className="summary-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faCalendarDays} />
          </span>
          <div>
            <dt>Este mês</dt>
            <dd>{groupAtas.filter((item) => item.registro.ata.data_reuniao.startsWith(monthKey)).length}</dd>
          </div>
        </dl>
        <dl className="summary-card">
          <span className="summary-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faUsers} />
          </span>
          <div>
            <dt>Servidores</dt>
            <dd>{uniqueServers.size}</dd>
          </div>
        </dl>
      </section>

      <ResponsavelAtasTable rows={rows} />
    </ResponsavelShell>
  );
}
