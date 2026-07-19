import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faClockRotateLeft,
  faFileCircleExclamation,
  faFileLines,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { requireAdminSession } from "@/lib/auth/require-session";
import { readAggregatedAtas } from "@/lib/sheets/repository";
import { AdminShell } from "@/app/grupos/admin-shell";
import {
  buildMissingAtaRows,
  buildSentAtaRows,
  currentMonthPeriod,
} from "./admin-atas-data";
import { AdminAtasTable } from "./admin-atas-table";

export const dynamic = "force-dynamic";

export default async function AdminAtasPage() {
  await requireAdminSession();
  const result = await readAggregatedAtas();
  const monthPeriod = currentMonthPeriod();
  const sentRows = buildSentAtaRows(result.atas);
  const missingRows = buildMissingAtaRows({
    grupos: result.grupos,
    horarios: result.grupo_horarios,
    sentRows,
    start: monthPeriod.start,
    end: monthPeriod.end,
  });
  const rows = [...sentRows, ...missingRows];
  const monthAtasCount = sentRows.filter((row) => row.data.startsWith(monthPeriod.key)).length;
  const pendingReviewCount = sentRows.filter(
    (row) => row.status === "Pendente de revisão",
  ).length;

  return (
    <AdminShell activeSection="atas">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>ATAS</h1>
        </div>
      </header>

      <section className="summary-cards admin-atas-summary" aria-label="Resumo das atas">
        <dl className="summary-card">
          <span className="summary-icon summary-icon-active" aria-hidden="true">
            <FontAwesomeIcon icon={faFileLines} />
          </span>
          <div>
            <dt>Total de atas</dt>
            <dd>{sentRows.length}</dd>
          </div>
        </dl>
        <dl className="summary-card">
          <span className="summary-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faCalendarDays} />
          </span>
          <div>
            <dt>Atas no mês</dt>
            <dd>{monthAtasCount}</dd>
          </div>
        </dl>
        <dl className="summary-card">
          <span className="summary-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faLayerGroup} />
          </span>
          <div>
            <dt>Total de grupos</dt>
            <dd>{result.grupos.length}</dd>
          </div>
        </dl>
        <dl className="summary-card">
          <span className="summary-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faFileCircleExclamation} />
          </span>
          <div>
            <dt>Atas pendentes de revisão</dt>
            <dd>{pendingReviewCount}</dd>
          </div>
        </dl>
        <dl className="summary-card">
          <span className="summary-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faClockRotateLeft} />
          </span>
          <div>
            <dt>Atas não enviadas no mês</dt>
            <dd>{missingRows.length}</dd>
          </div>
        </dl>
      </section>

      <AdminAtasTable
        rows={rows}
        monthStart={monthPeriod.start}
        monthEnd={monthPeriod.end}
      />
    </AdminShell>
  );
}
