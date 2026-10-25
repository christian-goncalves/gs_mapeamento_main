import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faChartSimple,
} from "@fortawesome/free-solid-svg-icons";
import { PrintDashboardButton } from "@/app/relatorios/print-dashboard-button";
import { ResponsavelShell } from "../responsavel-shell";
import { responsavelRelatoriosAzulFixture as fixture } from "./static-report-fixture";

export const dynamic = "force-static";

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export default function ResponsavelRelatoriosAzulPage() {
  return (
    <ResponsavelShell
      activeSection="relatorios"
      settingsHref={`/grupos/${fixture.group.id}`}
    >
      <div className="responsavel-relatorios-azul-demo">
        <header className="responsavel-relatorios-azul-demo-header">
          <div>
            <p className="eyebrow">Relatórios</p>
            <h1>DASHBOARD - {fixture.group.name}</h1>
            <p className="responsavel-relatorios-azul-demo-description">
              Visualize as informações por período.
            </p>
            <p className="responsavel-relatorios-azul-demo-note">
              Comparação visual estática.
            </p>
          </div>
          <Link
            className="button-link secondary"
            href="/responsavel/relatorios"
            aria-label="Voltar para o relatório do Responsável"
          >
            <span className="button-content">
              <FontAwesomeIcon icon={faChartSimple} aria-hidden="true" />
              <span>Voltar para Relatórios</span>
            </span>
          </Link>
        </header>

        <div className="responsavel-relatorios-azul-demo-content">
          <section
            className="responsavel-relatorios-azul-demo-filters"
            aria-label="Filtros do relatório"
          >
            <label>
              Mês
              <select defaultValue={fixture.period.month} aria-label="Mês">
                <option>{fixture.period.month}</option>
              </select>
            </label>
            <label>
              Ano
              <select defaultValue={fixture.period.year} aria-label="Ano">
                <option>{fixture.period.year}</option>
              </select>
            </label>
            <PrintDashboardButton />
          </section>

          <section
            className="responsavel-relatorios-azul-demo-section responsavel-relatorios-azul-demo-servers"
            aria-labelledby="relatorios-azul-servers"
          >
            <h2 id="relatorios-azul-servers">Servidores</h2>
            <div className="responsavel-relatorios-azul-demo-table-wrap">
              <table className="responsavel-relatorios-azul-demo-table">
                <thead>
                  <tr>
                    <th scope="col">Encargo</th>
                    <th scope="col">Nome</th>
                    <th scope="col">Desde</th>
                  </tr>
                </thead>
                <tbody>
                  {fixture.servers.map((server) => (
                    <tr key={server.role}>
                      <th scope="row">{server.role}</th>
                      <td>{server.name}</td>
                      <td>{server.since}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            className="responsavel-relatorios-azul-demo-section"
            aria-labelledby="relatorios-azul-consolidado"
          >
            <h2 id="relatorios-azul-consolidado">Consolidado</h2>
            <div className="responsavel-relatorios-azul-demo-metrics">
              {fixture.metrics.map((metric) => (
                <article
                  className="responsavel-relatorios-azul-demo-metric"
                  key={metric.label}
                >
                  <h3>{metric.label}</h3>
                  <strong>{formatNumber(metric.value)}</strong>
                </article>
              ))}
            </div>
          </section>

          <section
            className="responsavel-relatorios-azul-demo-section"
            aria-labelledby="relatorios-azul-reunioes"
          >
            <h2 id="relatorios-azul-reunioes">Consolidados por Reunião</h2>
            <div className="responsavel-relatorios-azul-demo-table-wrap">
              <table className="responsavel-relatorios-azul-demo-table responsavel-relatorios-azul-demo-meetings-table">
                <thead>
                  <tr>
                    <th scope="col">Dia da Semana</th>
                    <th scope="col">Presenças</th>
                    <th scope="col">Presenças<br />(média)</th>
                    <th scope="col">Ingressos</th>
                  </tr>
                </thead>
                <tbody>
                  {fixture.meetingsByWeekday.map((meeting) => (
                    <tr key={meeting.weekday}>
                      <td>{meeting.weekday}</td>
                      <td>{formatNumber(meeting.presences)}</td>
                      <td>{formatNumber(meeting.averagePresences)}</td>
                      <td>{formatNumber(meeting.ingressos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="responsavel-relatorios-azul-demo-bottom-grid">
            <section
              className="responsavel-relatorios-azul-demo-section"
              aria-labelledby="relatorios-azul-conquistas"
            >
              <h2 id="relatorios-azul-conquistas">Conquistas</h2>
              <div className="responsavel-relatorios-azul-demo-achievements">
                {fixture.achievements.map((achievement) => (
                  <article key={achievement.label}>
                    <h3>{achievement.label}</h3>
                    <strong>{formatNumber(achievement.value)}</strong>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <footer className="responsavel-relatorios-azul-demo-footer">
            <FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" />
            <span>
              Dados consolidados do grupo {fixture.group.name} referentes a {fixture.period.month}/{fixture.period.year}.
            </span>
          </footer>
        </div>
      </div>
    </ResponsavelShell>
  );
}
