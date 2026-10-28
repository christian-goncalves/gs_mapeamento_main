"use client";

import { Fragment, useState } from "react";
import type { MonthlyDashboardData } from "./monthly-group-dashboard-data";

const pageSizeOptions = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "Todo o período", value: 0 },
] as const;

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDay(value: string) {
  if (!value) return "";
  return value.split("-")[2] ?? "";
}

const weekdayLabels: Record<string, string> = {
  domingo: "Domingo",
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
};

function ResponsavelMeetingResults({
  weekdays,
}: {
  weekdays: MonthlyDashboardData["responsavelMeetingResults"];
}) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  function toggleDay(weekday: string) {
    setExpandedDays((current) => {
      const next = new Set(current);
      if (next.has(weekday)) next.delete(weekday);
      else next.add(weekday);
      return next;
    });
  }

  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table meeting-results-table meeting-results-table-weekday">
        <thead>
          <tr>
            <th scope="col">Dia da Semana</th>
            <th scope="col">Presenças</th>
            <th scope="col">Presenças<br />(média)</th>
            <th scope="col">Ingressos</th>
          </tr>
        </thead>
        <tbody>
          {weekdays.map((day) => {
            const isExpanded = expandedDays.has(day.weekday);
            const hasSchedules = day.schedules.length > 0;
            const averageRowSpan = hasSchedules && isExpanded
              ? day.schedules.length + 1
              : undefined;
            return (
              <Fragment key={day.weekday}>
                <tr className={isExpanded ? "meeting-weekday-summary-row is-expanded" : "meeting-weekday-summary-row"}>
                  <th scope="row">
                    <button
                      type="button"
                      className="meeting-weekday-toggle"
                      disabled={!hasSchedules}
                      aria-expanded={hasSchedules ? isExpanded : undefined}
                      onClick={() => toggleDay(day.weekday)}
                    >
                      <span className="meeting-weekday-chevron" aria-hidden="true">
                        {hasSchedules ? (isExpanded ? "▾" : "▸") : ""}
                      </span>
                      {weekdayLabels[day.weekday] ?? day.weekday}
                    </button>
                  </th>
                  <td>{formatNumber(day.presences)}</td>
                  <td rowSpan={averageRowSpan}>{formatNumber(day.averagePresences)}</td>
                  <td>{formatNumber(day.ingressos)}</td>
                </tr>
                {isExpanded ? day.schedules.map((schedule) => (
                  <tr className="meeting-weekday-schedule-row" key={`${day.weekday}-${schedule.time}`}>
                    <th scope="row">{schedule.time}</th>
                    <td>{formatNumber(schedule.presences)}</td>
                    <td>{formatNumber(schedule.ingressos)}</td>
                  </tr>
                )) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function MeetingResultsSection({
  meetings,
  weekdayResults,
  groupByWeekday = false,
}: {
  meetings: MonthlyDashboardData["meetingResults"];
  weekdayResults?: MonthlyDashboardData["responsavelMeetingResults"];
  groupByWeekday?: boolean;
}) {
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const pageCount = pageSize === 0 ? 1 : Math.max(1, Math.ceil(meetings.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleMeetings = pageSize === 0
    ? meetings
    : meetings.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstVisible = meetings.length === 0
    ? 0
    : pageSize === 0
      ? 1
      : (currentPage - 1) * pageSize + 1;
  const lastVisible = pageSize === 0
    ? meetings.length
    : Math.min(currentPage * pageSize, meetings.length);

  if (groupByWeekday) {
    return (
      <section className="dashboard-section dashboard-responsavel-meeting-results">
        <div className="meeting-results-header">
          <div className="dashboard-section-title">
            <h2>Consolidados por Reunião</h2>
          </div>
        </div>
        <ResponsavelMeetingResults weekdays={weekdayResults ?? []} />
      </section>
    );
  }

  return (
    <section className="dashboard-section">
      <div className="meeting-results-header">
        <div className="dashboard-section-title">
          <h2>Consolidados por Reunião</h2>
        </div>
        <div className="meeting-page-sizes" role="group" aria-label="Reuniões por página">
          {pageSizeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={pageSize === option.value ? "meeting-page-size is-active" : "meeting-page-size"}
              aria-pressed={pageSize === option.value}
              onClick={() => {
                setPageSize(option.value);
                setPage(1);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-table-wrap">
        <table className={`dashboard-table meeting-results-table${groupByWeekday ? " meeting-results-table-weekday" : ""}`}>
          <thead>
            <tr>
              <th>Data  |  Horário</th>
              <th>Presenças</th>
              <th>Ingressos</th>
              <th>Conquistas</th>
            </tr>
          </thead>
          <tbody>
            {visibleMeetings.length > 0 ? visibleMeetings.map((meeting) => (
              <tr key={meeting.id}>
                <td>{formatDay(meeting.date)}  |  {meeting.time}</td>
                <td>{formatNumber(meeting.presences)}</td>
                <td>{formatNumber(meeting.ingressos)}</td>
                <td>{formatNumber(meeting.achievements)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4}>Nenhuma reunião aprovada neste período.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="meeting-pagination-footer">
        <p className="meeting-pagination-summary" aria-live="polite">
          {meetings.length > 0
            ? `Exibindo ${formatNumber(firstVisible)}–${formatNumber(lastVisible)} de ${formatNumber(meetings.length)} reuniões`
            : "Nenhuma reunião para exibir"}
        </p>
        {pageSize !== 0 && pageCount > 1 ? (
          <nav className="meeting-pagination-nav" aria-label="Paginação dos resultados por reunião">
            <button
              type="button"
              className="meeting-page-nav-button"
              disabled={currentPage === 1}
              onClick={() => setPage(Math.max(1, currentPage - 1))}
            >
              Anterior
            </button>
            <span aria-current="page">Página {currentPage} de {pageCount}</span>
            <button
              type="button"
              className="meeting-page-nav-button"
              disabled={currentPage === pageCount}
              onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
            >
              Próxima
            </button>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
