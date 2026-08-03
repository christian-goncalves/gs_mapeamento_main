import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faChartSimple,
  faClock,
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

const monthLabels = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
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
}: {
  label: string;
  value: number;
  icon: Parameters<typeof FontAwesomeIcon>[0]["icon"];
}) {
  return (
    <article className="dashboard-metric-card">
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
}: {
  data: MonthlyDashboardData;
  groups: Grupo[];
  years: number[];
  showGroupFilter: boolean;
}) {
  const selectedMonth = String(data.filters.month);
  const selectedYear = String(data.filters.year);

  return (
    <div className="monthly-dashboard-page">
      <section className="monthly-dashboard-sheet" aria-label="Dashboard mensal do grupo">
        <header className="monthly-dashboard-hero">
          <span className="monthly-dashboard-hero-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faUsers} />
          </span>
          <div>
            <h1>Dashboard Mensal - {data.group.grupo_nome}</h1>
          </div>
        </header>

        <DashboardFilters
          action={showGroupFilter ? "/admin/relatorios" : "/responsavel/relatorios"}
          groups={groups}
          years={years}
          selectedGroupId={data.filters.grupoId}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          showGroupFilter={showGroupFilter}
        />

        <section className="dashboard-section">
          <div className="dashboard-section-title">
            <span aria-hidden="true"><FontAwesomeIcon icon={faChartSimple} /></span>
            <h2>1. Consolidado</h2>
          </div>
          <div className="dashboard-metrics-grid">
            <MetricCard label="Total de reuniões" value={data.consolidated.totalReunioes} icon={faUsers} />
            <MetricCard label="Reuniões sem ATA / Sala fechada" value={data.consolidated.reunioesSemAtaOuSalaFechada} icon={faDoorClosed} />
            <MetricCard label="Total de presenças" value={data.consolidated.totalPresencas} icon={faUsers} />
            <MetricCard label="Média de presenças" value={data.consolidated.mediaPresencas} icon={faUser} />
            <MetricCard label="Visitantes" value={data.consolidated.visitantes} icon={faUsers} />
            <MetricCard label="Média de localidades" value={data.consolidated.mediaLocalidades} icon={faLocationDot} />
            <MetricCard label="Média de estados" value={data.consolidated.mediaEstados} icon={faGlobe} />
            <MetricCard label="Total de países" value={data.consolidated.totalPaises} icon={faFlag} />
            <MetricCard label="Ingressos" value={data.consolidated.ingressos} icon={faMedal} />
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-title">
            <span aria-hidden="true"><FontAwesomeIcon icon={faClock} /></span>
            <h2>2. Resultados por horário</h2>
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

        <div className="dashboard-bottom-grid">
          <section className="dashboard-section dashboard-achievements">
            <div className="dashboard-section-title">
              <span aria-hidden="true"><FontAwesomeIcon icon={faMedal} /></span>
              <h2>3. Conquistas de tempo</h2>
            </div>
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
          </section>

          <section className="dashboard-section dashboard-mesa">
            <div className="dashboard-section-title">
              <span aria-hidden="true"><FontAwesomeIcon icon={faUser} /></span>
              <h2>4. Servidores da Mesa</h2>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table dashboard-mesa-table">
                <thead>
                  <tr>
                    <th>Encargo</th>
                    <th>Nome</th>
                    <th>Início</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mesa.map((row) => (
                    <tr key={row.encargo}>
                      <th>{row.encargo}</th>
                      <td className={row.vacant ? "mesa-vacant-value" : undefined}>
                        {row.nome || "-"}
                      </td>
                      <td>{formatDate(row.data_inicio) || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
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
