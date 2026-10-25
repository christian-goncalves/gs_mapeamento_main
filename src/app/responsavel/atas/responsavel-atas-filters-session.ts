import type { ResponsavelAtaStatus } from "./responsavel-atas-data";

export type ResponsavelAtasFilters = {
  startDate: string;
  endDate: string;
  weekday: string;
  time: string;
  preenchidoPor: string;
  status: "todos" | ResponsavelAtaStatus;
};

const allowedStatuses = new Set<ResponsavelAtasFilters["status"]>([
  "todos",
  "Enviada",
  "Não enviada",
  "Pendente de revisão",
  "Substituída",
  "Excluída",
]);

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function stringOrDefault(value: unknown, fallback: string) {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export function responsavelAtasFiltersSessionKey({
  groupId,
  historyMode,
}: {
  groupId: string;
  historyMode: boolean;
}) {
  const mode = historyMode ? "historico" : "atuais";
  return `gs-mapeamento:responsavel-atas:filtros:${groupId}:${mode}`;
}

export function parseResponsavelAtasFilters(
  storedValue: string | null,
  defaults: ResponsavelAtasFilters,
): ResponsavelAtasFilters {
  if (!storedValue) return defaults;

  try {
    const parsed = JSON.parse(storedValue) as Record<string, unknown>;
    const status = allowedStatuses.has(parsed.status as ResponsavelAtasFilters["status"])
      ? parsed.status as ResponsavelAtasFilters["status"]
      : defaults.status;

    return {
      startDate: isIsoDate(parsed.startDate) ? parsed.startDate : defaults.startDate,
      endDate: isIsoDate(parsed.endDate) ? parsed.endDate : defaults.endDate,
      weekday: stringOrDefault(parsed.weekday, defaults.weekday),
      time: stringOrDefault(parsed.time, defaults.time),
      preenchidoPor: stringOrDefault(parsed.preenchidoPor, defaults.preenchidoPor),
      status,
    };
  } catch {
    return defaults;
  }
}
