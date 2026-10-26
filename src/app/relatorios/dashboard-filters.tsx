"use client";

import type { ChangeEvent } from "react";
import type { Grupo } from "@/domain/entities";
import { PrintDashboardButton } from "./print-dashboard-button";

const months = [
  ["1", "Janeiro"],
  ["2", "Fevereiro"],
  ["3", "Março"],
  ["4", "Abril"],
  ["5", "Maio"],
  ["6", "Junho"],
  ["7", "Julho"],
  ["8", "Agosto"],
  ["9", "Setembro"],
  ["10", "Outubro"],
  ["11", "Novembro"],
  ["12", "Dezembro"],
] as const;

export function submitDashboardFilters(event: ChangeEvent<HTMLSelectElement>) {
  event.currentTarget.form?.requestSubmit();
}

export function DashboardFilters({
  action,
  groups,
  years,
  selectedGroupId,
  selectedMonth,
  selectedYear,
  showGroupFilter,
  isResponsavelDashboard = false,
}: {
  action: string;
  groups: Grupo[];
  years: number[];
  selectedGroupId: string;
  selectedMonth: string;
  selectedYear: string;
  showGroupFilter: boolean;
  isResponsavelDashboard?: boolean;
}) {
  return (
    <form
      className={[
        "dashboard-filters",
        !showGroupFilter && "dashboard-filters-no-group",
        isResponsavelDashboard && "dashboard-filters-responsavel",
      ].filter(Boolean).join(" ")}
      action={action}
    >
      {showGroupFilter && (
        <label>
          Grupo
          <select
            name="grupo"
            defaultValue={selectedGroupId}
            onChange={submitDashboardFilters}
          >
            {groups.map((group) => (
              <option key={group.grupo_id} value={group.grupo_id}>
                {group.grupo_nome}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className={isResponsavelDashboard ? "dashboard-filter-period-label" : undefined}>
        Mês
        <select
          name="mes"
          defaultValue={selectedMonth}
          onChange={submitDashboardFilters}
        >
          {months.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className={isResponsavelDashboard ? "dashboard-filter-period-label" : undefined}>
        Ano
        <select
          name="ano"
          defaultValue={selectedYear}
          onChange={submitDashboardFilters}
        >
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </label>
      <PrintDashboardButton />
    </form>
  );
}
