"use client";

import { useEffect, type ChangeEvent } from "react";
import type { Grupo } from "@/domain/entities";
import { ChoiceAutocomplete } from "../choice-autocomplete";
import { MonthlyReportActions } from "./monthly-report-actions";

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

function isPeriodControl(
  control: Element | RadioNodeList | null,
): control is HTMLInputElement | HTMLSelectElement {
  return control instanceof HTMLInputElement || control instanceof HTMLSelectElement;
}

const responsavelPeriodStorageKey = "gs-mapeamento:responsavel:relatorios:periodo";

type ResponsiblePeriod = { month: string; year: string };

function readResponsiblePeriod(): ResponsiblePeriod | null {
  try {
    const stored = sessionStorage.getItem(responsavelPeriodStorageKey);
    if (!stored) return null;

    const period: unknown = JSON.parse(stored);
    if (
      typeof period !== "object" || period === null ||
      !("month" in period) || typeof period.month !== "string" ||
      !("year" in period) || typeof period.year !== "string" ||
      !/^(?:[1-9]|1[0-2])$/.test(period.month) ||
      !/^20\d{2}$/.test(period.year)
    ) return null;

    return { month: period.month, year: period.year };
  } catch {
    return null;
  }
}

function saveResponsiblePeriod(period: ResponsiblePeriod) {
  try {
    sessionStorage.setItem(responsavelPeriodStorageKey, JSON.stringify(period));
  } catch {
    // Relatórios continuam utilizáveis quando o navegador bloqueia o armazenamento.
  }
}

export function DashboardFilters({
  action,
  groups,
  years,
  selectedGroupId,
  selectedMonth,
  selectedYear,
  groupName = "",
  defaultRecipient = "",
  showGroupFilter,
  isResponsavelDashboard = false,
}: {
  action: string;
  groups: Grupo[];
  years: number[];
  selectedGroupId: string;
  selectedMonth: string;
  selectedYear: string;
  groupName?: string;
  defaultRecipient?: string;
  showGroupFilter: boolean;
  isResponsavelDashboard?: boolean;
}) {
  useEffect(() => {
    if (!isResponsavelDashboard) return;

    const form = document.querySelector<HTMLFormElement>(".dashboard-filters-responsavel");
    if (!(form instanceof HTMLFormElement)) return;

    const monthSelect = form.elements.namedItem("mes");
    const yearSelect = form.elements.namedItem("ano");
    if (!isPeriodControl(monthSelect) || !isPeriodControl(yearSelect)) return;

    const params = new URLSearchParams(window.location.search);
    if (params.has("mes") || params.has("ano")) {
      saveResponsiblePeriod({ month: monthSelect.value, year: yearSelect.value });
      return;
    }

    const storedPeriod = readResponsiblePeriod();
    if (!storedPeriod || !years.includes(Number(storedPeriod.year))) return;
    if (storedPeriod.month === monthSelect.value && storedPeriod.year === yearSelect.value) return;

    monthSelect.value = storedPeriod.month;
    yearSelect.value = storedPeriod.year;
    form.requestSubmit();
  }, [isResponsavelDashboard, selectedMonth, selectedYear, years]);

  function handleFilterChange(event: ChangeEvent<HTMLSelectElement>) {
    if (isResponsavelDashboard) {
      const form = event.currentTarget.form;
      const month = form?.elements.namedItem("mes");
      const year = form?.elements.namedItem("ano");
      if (month instanceof HTMLSelectElement && year instanceof HTMLSelectElement) {
        saveResponsiblePeriod({ month: month.value, year: year.value });
      }
    }
    submitDashboardFilters(event);
  }

  function handleResponsiblePeriodChoice(name: "mes" | "ano", value: string) {
    const form = document.querySelector<HTMLFormElement>(".dashboard-filters-responsavel");
    if (!(form instanceof HTMLFormElement)) return;

    const month = form.elements.namedItem("mes");
    const year = form.elements.namedItem("ano");
    if (!isPeriodControl(month) || !isPeriodControl(year)) return;

    if (name === "mes") month.value = value;
    else year.value = value;
    saveResponsiblePeriod({ month: month.value, year: year.value });
    form.requestSubmit();
  }

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
            onChange={handleFilterChange}
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
        {isResponsavelDashboard ? (
          <ChoiceAutocomplete
            id="responsavel-dashboard-month"
            name="mes"
            className="dashboard-period-autocomplete"
            value={selectedMonth}
            options={months.map(([value, label]) => ({ value, label }))}
            onChange={(value) => handleResponsiblePeriodChoice("mes", value)}
          />
        ) : (
          <select name="mes" defaultValue={selectedMonth} onChange={handleFilterChange}>
            {months.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        )}
      </label>
      <label className={isResponsavelDashboard ? "dashboard-filter-period-label" : undefined}>
        Ano
        {isResponsavelDashboard ? (
          <ChoiceAutocomplete
            id="responsavel-dashboard-year"
            name="ano"
            className="dashboard-period-autocomplete"
            value={selectedYear}
            options={years.map((year) => ({ value: String(year), label: String(year) }))}
            onChange={(value) => handleResponsiblePeriodChoice("ano", value)}
          />
        ) : (
          <select name="ano" defaultValue={selectedYear} onChange={handleFilterChange}>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        )}
      </label>
      <div className="dashboard-report-actions">
        <MonthlyReportActions
          groupId={selectedGroupId}
          month={selectedMonth}
          year={selectedYear}
          groupName={groupName}
          defaultRecipient={defaultRecipient}
        />
      </div>
    </form>
  );
}
