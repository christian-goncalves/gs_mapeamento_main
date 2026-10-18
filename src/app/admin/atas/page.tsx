import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faClockRotateLeft,
  faFileCircleExclamation,
  faFileLines,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { requireAdminSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { AdminShell } from "@/app/grupos/admin-shell";
import {
  buildMissingAtaRows,
  buildSentAtaRows,
  currentMonthPeriod,
} from "./admin-atas-data";
import { AdminAtasTable } from "./admin-atas-table";
import { AtaApprovalPanel } from "@/app/atas/ata-approval-panel";

export const dynamic = "force-dynamic";

export default async function AdminAtasPage() {
  const { result } = await requireAdminSessionWithAggregatedAtas();
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
  const approvedRows = sentRows.filter((row) => row.status === "Enviada");
  const monthAtasCount = approvedRows.filter((row) => row.data.startsWith(monthPeriod.key)).length;
  const pendingReviewCount = sentRows.filter(
    (row) => row.status === "Pendente de revisão",
  ).length;
  const approvalRows = result.atas
    .filter((item) => item.registro.ata.status_registro === "ativa" && item.registro.ata.status_aprovacao === "pendente_revisao")
    .map(({ grupo, registro }) => ({
      ataId: registro.ata.ata_id,
      updatedAt: registro.ata.updated_at,
      index: registro.ata.indice_personalizado_grupo,
      date: registro.ata.data_reuniao,
      time: registro.ata.hora_inicio,
      group: grupo.grupo_nome,
    }));

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
            <dd>{approvedRows.length}</dd>
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

      <AtaApprovalPanel rows={approvalRows} />

      <AdminAtasTable
        rows={rows}
        monthStart={monthPeriod.start}
        monthEnd={monthPeriod.end}
      />
    </AdminShell>
  );
}
