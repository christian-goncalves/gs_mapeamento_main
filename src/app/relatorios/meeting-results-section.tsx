"use client";

import { useState } from "react";
import type { MonthlyDashboardData } from "./monthly-group-dashboard-data";
import { roundPresenceAverage } from "./presence-average";

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

export function MeetingResultsSection({
  meetings,
  groupByWeekday = false,
}: {
  meetings: MonthlyDashboardData["meetingResults"];
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
  const weekdays = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];
  const weekdayResults = weekdays.map((weekday, dayOfWeek) => {
    const dayMeetings = meetings.filter((meeting) => {
      const [year, month, day] = meeting.date.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === dayOfWeek;
    });
    const presences = dayMeetings.reduce((total, meeting) => total + meeting.presences, 0);
    return {
      weekday,
      presences,
      averagePresences: roundPresenceAverage(presences, dayMeetings.length),
      ingressos: dayMeetings.reduce((total, meeting) => total + meeting.ingressos, 0),
    };
  });

  return (
    <section className={`dashboard-section${groupByWeekday ? " dashboard-responsavel-meeting-results" : ""}`}>
      <div className="meeting-results-header">
        <div className="dashboard-section-title">
          <h2>Consolidados por Reunião</h2>
        </div>
        {!groupByWeekday ? <div className="meeting-page-sizes" role="group" aria-label="Reuniões por página">
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
        </div> : null}
      </div>

      <div className="dashboard-table-wrap">
        <table className={`dashboard-table meeting-results-table${groupByWeekday ? " meeting-results-table-weekday" : ""}`}>
          <thead>
            <tr>
              {groupByWeekday ? (
                <>
                  <th>Dia da Semana</th>
                  <th>Presenças</th>
                  <th>Presenças<br />(média)</th>
                  <th>Ingressos</th>
                </>
              ) : (
                <>
                  <th>Data  |  Horário</th>
                  <th>Presenças</th>
                  <th>Ingressos</th>
                  <th>Conquistas</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {groupByWeekday ? weekdayResults.map((result) => (
              <tr key={result.weekday}>
                <td>{result.weekday}</td>
                <td>{formatNumber(result.presences)}</td>
                <td>{formatNumber(result.averagePresences)}</td>
                <td>{formatNumber(result.ingressos)}</td>
              </tr>
            )) : visibleMeetings.length > 0 ? visibleMeetings.map((meeting) => (
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

      {!groupByWeekday ? <div className="meeting-pagination-footer">
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
      </div> : null}
    </section>
  );
}
