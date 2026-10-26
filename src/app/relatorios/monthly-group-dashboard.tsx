import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactNode } from "react";
import {
  faCalendarDays,
  faDoorClosed,
  faFlag,
  faGlobe,
  faLocationDot,
  faMedal,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { Grupo } from "@/domain/entities";
import type { MonthlyDashboardData } from "./monthly-group-dashboard-data";
import { DashboardFilters } from "./dashboard-filters";
import { MeetingResultsSection } from "./meeting-results-section";

const monthLabels = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function MetricCard({
  label,
  value,
  icon,
  fullWidth = false,
  labelTone,
}: {
  label: string;
  value: number;
  icon: Parameters<typeof FontAwesomeIcon>[0]["icon"];
  fullWidth?: boolean;
  labelTone?: "850" | "800" | "750";
}) {
  return (
    <article
      className={`dashboard-metric-card${fullWidth ? " dashboard-metric-card-full-row" : ""}${
        labelTone ? ` dashboard-metric-card-label-tone-${labelTone}` : ""
      }`}
    >
      <span className="dashboard-metric-icon" aria-hidden="true">
        <FontAwesomeIcon icon={icon} />
      </span>
      <h3>{label}</h3>
      <strong>{formatNumber(value)}</strong>
    </article>
  );
}

export function MonthlyGroupDashboard({
  data,
  groups,
  years,
  showGroupFilter,
  showFoundationMeetingCard = false,
  showResponsavelHeader = false,
  headerAction,
}: {
  data: MonthlyDashboardData;
  groups: Grupo[];
  years: number[];
  showGroupFilter: boolean;
  showFoundationMeetingCard?: boolean;
  showResponsavelHeader?: boolean;
  headerAction?: ReactNode;
}) {
  const selectedMonth = String(data.filters.month);
  const selectedYear = String(data.filters.year);
  const serversSection = (
    <section className={`dashboard-section dashboard-mesa${showResponsavelHeader ? " dashboard-responsavel-mesa" : ""}`}>
      <div className="dashboard-section-title">
        <h2>{showResponsavelHeader ? "Servidores" : "4. Servidores"}</h2>
      </div>
      <div className="dashboard-table-wrap">
        <table className={`dashboard-table dashboard-mesa-table${showResponsavelHeader ? " dashboard-responsavel-mesa-table" : ""}`}>
          <thead>
            <tr>
              <th>Encargo</th>
              <th>Nome</th>
              <th>Desde</th>
            </tr>
          </thead>
          <tbody>
            {data.mesa.length > 0 ? (
              data.mesa.map((row) => (
                <tr key={row.encargo}>
                  <th>{row.encargo}</th>
                  <td className={row.vacant ? "mesa-vacant-value" : undefined}>
                    {row.vacant ? "Vago" : row.nome || "-"}
                  </td>
                  <td>{formatDate(row.data_inicio) || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>Nenhum encargo cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="monthly-dashboard-page">
      {showResponsavelHeader ? (
        <header className="responsavel-page-header dashboard-responsavel-title">
          <div>
            <p className="eyebrow">Relatórios</p>
            <h1>
              GRUPO {data.group.grupo_nome.toLocaleUpperCase("pt-BR")}
            </h1>
            <p className="responsavel-page-description">
              Visualize as informações por período.
            </p>
          </div>
          {headerAction ? (
            <div className="responsavel-page-header-actions">{headerAction}</div>
          ) : null}
        </header>
      ) : null}
      <section
        className={`monthly-dashboard-sheet${showResponsavelHeader ? " monthly-dashboard-sheet-responsavel" : ""}`}
        aria-label={showResponsavelHeader ? "Dashboard do grupo" : "Dashboard mensal do grupo"}
      >
        {!showResponsavelHeader ? (
          <header className="monthly-dashboard-hero">
            <span className="monthly-dashboard-hero-icon" aria-hidden="true">
              <FontAwesomeIcon icon={faUsers} />
            </span>
            <div>
              <h1>Dashboard Mensal - {data.group.grupo_nome}</h1>
            </div>
          </header>
        ) : null}

        <DashboardFilters
          action={showGroupFilter ? "/admin/relatorios" : "/responsavel/relatorios"}
          groups={groups}
          years={years}
          selectedGroupId={data.filters.grupoId}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          showGroupFilter={showGroupFilter}
          isResponsavelDashboard={showResponsavelHeader}
        />

        {showResponsavelHeader ? serversSection : null}

        <section className={`dashboard-section${showResponsavelHeader ? " dashboard-responsavel-consolidated" : ""}`}>
          <div className="dashboard-section-title">
            <h2>{showResponsavelHeader ? "Consolidado" : "1. Consolidado"}</h2>
          </div>
          <div
            className={`dashboard-metrics-grid${
              showResponsavelHeader ? " dashboard-metrics-grid-responsavel" : ""
            }`}
          >
            {showFoundationMeetingCard ? (
              <MetricCard
                label="Reuniões desde a Fundação"
                value={data.consolidated.reunioesDesdeFundacao}
                icon={faCalendarDays}
                fullWidth={showResponsavelHeader}
              />
            ) : null}
            {showResponsavelHeader ? (
              <>
                <MetricCard label="Reuniões" value={data.consolidated.totalReunioes} icon={faUsers} labelTone="850" />
                <MetricCard label="Presenças" value={data.consolidated.totalPresencas} icon={faUser} labelTone="850" />
                <MetricCard label="Média de Presenças" value={data.consolidated.mediaPresencasResponsavel} icon={faUser} labelTone="850" />
                <MetricCard label="Conquistas" value={data.achievements.subtotal} icon={faMedal} labelTone="800" />
                <MetricCard label="Visitantes" value={data.consolidated.visitantes} icon={faUsers} labelTone="800" />
                <MetricCard label="Ingressos" value={data.consolidated.ingressos} icon={faDoorClosed} labelTone="800" />
                <MetricCard label="Cidades" value={data.consolidated.totalCidades} icon={faLocationDot} labelTone="750" />
                <MetricCard label="Estados" value={data.consolidated.totalEstadosUnicos} icon={faFlag} labelTone="750" />
                <MetricCard label="Outros Países" value={data.consolidated.totalOutrosPaises} icon={faGlobe} labelTone="750" />
              </>
            ) : (
              <>
                <MetricCard label="Total de Reuniões" value={data.consolidated.totalReunioes} icon={faUsers} />
                <MetricCard label="Reuniões sem ATA / Sala Fechada" value={data.consolidated.reunioesSemAtaOuSalaFechada} icon={faDoorClosed} />
                <MetricCard label="Total de Presenças" value={data.consolidated.totalPresencas} icon={faUsers} />
                <MetricCard label="Média de presenças" value={data.consolidated.mediaPresencas} icon={faUser} />
                <MetricCard label="Visitantes" value={data.consolidated.visitantes} icon={faUsers} />
                <MetricCard label="Média de Localidades" value={data.consolidated.mediaLocalidades} icon={faLocationDot} />
                <MetricCard label="Média de Estados" value={data.consolidated.mediaEstados} icon={faGlobe} />
                <MetricCard label="Total de Países" value={data.consolidated.totalPaises} icon={faFlag} />
                <MetricCard label="Ingressos" value={data.consolidated.ingressos} icon={faMedal} />
              </>
            )}
          </div>
        </section>

        {showResponsavelHeader ? (
          <MeetingResultsSection
            meetings={data.meetingResults}
            groupByWeekday={showResponsavelHeader}
          />
        ) : (
          <section className="dashboard-section">
            <div className="dashboard-section-title">
              <h2>2. Consolidados por Reunião</h2>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Horário</th>
                    {data.bySchedule.horarios.map((horario) => (
                      <th key={horario}>{horario}</th>
                    ))}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>Média part.</th>
                    {data.bySchedule.mediaParticipantes.map((value, index) => (
                      <td key={data.bySchedule.horarios[index]}>{formatNumber(value)}</td>
                    ))}
                    <td><strong>{formatNumber(data.bySchedule.totalMediaParticipantes)}</strong></td>
                  </tr>
                  <tr>
                    <th>Ingressos</th>
                    {data.bySchedule.ingressos.map((value, index) => (
                      <td key={data.bySchedule.horarios[index]}>{formatNumber(value)}</td>
                    ))}
                    <td><strong>{formatNumber(data.bySchedule.totalIngressos)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className={`dashboard-bottom-grid${showResponsavelHeader ? " dashboard-bottom-grid-responsavel" : ""}`}>
          <section
            className={`dashboard-section dashboard-achievements${
              showResponsavelHeader ? " dashboard-achievements-cards" : ""
            }`}
          >
            <div className="dashboard-section-title">
              <h2>{showResponsavelHeader ? "Conquistas" : "3. Conquistas"}</h2>
            </div>
            {showResponsavelHeader ? (
              <div className="dashboard-achievements-grid">
                {data.achievements.rows.map((row) => (
                  <article className="dashboard-achievement-card" key={row.code}>
                    <h3 className="dashboard-achievement-label">
                      {row.label}
                    </h3>
                    <strong>{formatNumber(row.value)}</strong>
                  </article>
                ))}
                <article className="dashboard-achievement-card">
                  <h3 className="dashboard-achievement-label">Total</h3>
                  <strong>{formatNumber(data.achievements.total)}</strong>
                </article>
              </div>
            ) : (
              <table className="dashboard-achievement-table">
                <tbody>
                  <tr>
                    <th style={{ backgroundColor: data.achievements.ingresso.color }}>
                      {data.achievements.ingresso.label}
                    </th>
                    <td>{formatNumber(data.achievements.ingresso.value)}</td>
                  </tr>
                  {data.achievements.rows.map((row) => (
                    <tr
                      className={`achievement-color-row${
                        row.code === "multiplos_anos"
                          ? " achievement-color-row-last"
                          : ""
                      }`}
                      key={row.code}
                    >
                      <th
                        style={{ backgroundColor: row.color }}
                        className={
                          row.code === "multiplos_anos"
                            ? "achievement-dark"
                            : undefined
                        }
                      >
                        {row.label}
                      </th>
                      <td>{formatNumber(row.value)}</td>
                    </tr>
                  ))}
                  <tr className="achievement-total-row">
                    <th>Subtotal</th>
                    <td>{formatNumber(data.achievements.subtotal)}</td>
                  </tr>
                  <tr className="achievement-total-row">
                    <th>Total</th>
                    <td>{formatNumber(data.achievements.total)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </section>

          {!showResponsavelHeader ? serversSection : null}
        </div>

        <footer className="dashboard-footer">
          <FontAwesomeIcon icon={faCalendarDays} />
          <span>
          Dados consolidados do grupo {data.group.grupo_nome} referentes a {monthLabels[data.filters.month - 1]}/{data.filters.year}.
          </span>
        </footer>
      </section>
    </div>
  );
}
