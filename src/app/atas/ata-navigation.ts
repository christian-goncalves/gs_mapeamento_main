import "server-only";

import type { AggregatedAta } from "@/domain/aggregate";
import { deriveAtaNumbers } from "@/domain/ata-numbering";
import type { AppAccess } from "@/lib/auth/access";
import { canAccessGroup } from "@/lib/auth/access";
import { buildResponsavelAtaRows } from "@/app/responsavel/atas/responsavel-atas-data";

type SearchValue = string | string[] | undefined;
export type AtaNavigationSearchParams = Record<string, SearchValue>;

type NavigationAta = {
  id: string;
  groupId: string;
  groupName: string;
  date: string;
  time: string;
  index: number | null;
  server: string;
  status: string;
  sourcePosition: number;
};

type SortOrder = { column: number; direction: "asc" | "desc" };

function queryValue(params: AtaNavigationSearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function validIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function normalized(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function primaryServerName(item: AggregatedAta) {
  return [...item.registro.servidores]
    .sort((first, second) => first.ordem - second.ordem)[0]?.nome ?? "";
}

function statusLabel(item: AggregatedAta) {
  const { ata } = item.registro;
  if (ata.status_registro === "substituida") return "Substituída";
  if (ata.status_registro === "excluida") return "Excluída";
  return ata.status_aprovacao === "pendente_revisao" ? "Pendente de revisão" : "Enviada";
}

function defaultOrder(source: string): SortOrder[] {
  if (source === "admin") return [{ column: 1, direction: "desc" }];
  if (source === "responsavel" || source === "historico") {
    return [{ column: 0, direction: "desc" }];
  }
  return [
    { column: 1, direction: "desc" },
    { column: 2, direction: "desc" },
  ];
}

function parseOrder(value: string | undefined, source: string): SortOrder[] {
  if (!value) return defaultOrder(source);
  const parsed = value.split(",").flatMap((part) => {
    const match = /^(\d+)\.(asc|desc)$/.exec(part);
    if (!match) return [];
    const column = Number(match[1]);
    const maxColumn = source === "admin" ? 4 : 4;
    return column <= maxColumn
      ? [{ column, direction: match[2] as SortOrder["direction"] }]
      : [];
  });
  return parsed.length ? parsed : defaultOrder(source);
}

function compareText(first: string, second: string) {
  return first.localeCompare(second, "pt-BR", { numeric: true, sensitivity: "base" });
}

function compareNumber(first: number | null, second: number | null) {
  if (first === null) return second === null ? 0 : -1;
  if (second === null) return 1;
  return first - second;
}

function compareByColumn(first: NavigationAta, second: NavigationAta, column: number, source: string) {
  if (source === "admin") {
    if (column === 0) {
      const firstIndex = first.index === null ? "-" : `#${first.index}`;
      const secondIndex = second.index === null ? "-" : `#${second.index}`;
      return compareText(firstIndex, secondIndex);
    }
    if (column === 1) return compareText(first.date, second.date);
    if (column === 2) return compareText(first.time, second.time);
    if (column === 3) return compareText(first.groupName, second.groupName);
    if (column === 4) return compareText(first.status, second.status);
    return 0;
  }

  if (column === 0) return compareNumber(first.index, second.index);
  if (column === 1) {
    return compareText(first.date, second.date) || compareText(first.time, second.time);
  }
  if (column === 2) return compareText(first.time, second.time);
  if (column === 3) return compareText(first.server, second.server);
  if (column === 4) return source === "historico" ? compareText(first.status, second.status) : 0;
  return 0;
}

function sortAtas(rows: NavigationAta[], source: string, order: SortOrder[]) {
  return rows.sort((first, second) => {
    for (const sort of order) {
      const difference = compareByColumn(first, second, sort.column, source);
      if (difference) return sort.direction === "asc" ? difference : -difference;
    }
    if (source === "admin") {
      const fixedTimeOrder = compareText(first.time, second.time);
      if (fixedTimeOrder) return fixedTimeOrder;
      const fixedGroupOrder = compareText(first.groupName, second.groupName);
      if (fixedGroupOrder) return fixedGroupOrder;
    }
    return first.sourcePosition - second.sourcePosition;
  });
}

export function getAtaNavigation({
  currentAtaId,
  currentGroupId,
  atas,
  access,
  searchParams,
}: {
  currentAtaId: string;
  currentGroupId: string;
  atas: AggregatedAta[];
  access: AppAccess;
  searchParams: AtaNavigationSearchParams;
}) {
  const requestedSource = queryValue(searchParams, "origem") ?? "direto";
  const source = requestedSource === "admin" && access.role === "administrador"
    ? "admin"
    : requestedSource === "historico" && access.role === "responsavel_grupo"
      ? "historico"
      : requestedSource === "responsavel" && access.role === "responsavel_grupo"
        ? "responsavel"
        : "direto";
  const requestedGroup = queryValue(searchParams, "grupo");
  const groupFilter = source === "admin" && requestedGroup && requestedGroup !== "todos"
    ? requestedGroup
    : undefined;
  const start = queryValue(searchParams, "de");
  const end = queryValue(searchParams, "ate");
  const time = queryValue(searchParams, "horario");
  const status = queryValue(searchParams, "status");
  const filledBy = queryValue(searchParams, "preenchido") ?? "";
  const order = parseOrder(queryValue(searchParams, "ordem"), source);
  const ataNumbers = deriveAtaNumbers(atas);
  const responsiblePositions = new Map<string, number>();
  if (source === "responsavel" || source === "historico") {
    const group = atas.find((item) => item.grupo.grupo_id === currentGroupId)?.grupo;
    if (group) {
      buildResponsavelAtaRows({ group, atas, horarios: [] }).forEach((row, position) => {
        if (row.ataId) responsiblePositions.set(row.ataId, position);
      });
    }
  }

  let rows = atas.flatMap((item, sourcePosition): NavigationAta[] => {
    const { ata } = item.registro;
    if (!canAccessGroup(access, item.grupo.grupo_id)) return [];
    if (source === "direto" && item.grupo.grupo_id !== currentGroupId) return [];
    if ((source === "responsavel" || source === "historico") && item.grupo.grupo_id !== currentGroupId) return [];
    if (groupFilter && item.grupo.grupo_id !== groupFilter) return [];
    if (source === "historico") {
      if (ata.status_registro === "ativa") return [];
    } else if (ata.status_registro !== "ativa") {
      return [];
    }
    if (validIsoDate(start) && ata.data_reuniao < start) return [];
    if (validIsoDate(end) && ata.data_reuniao > end) return [];
    if (time && time !== "todos" && ata.hora_inicio !== time) return [];
    const currentStatus = statusLabel(item);
    if (status && status !== "todos" && status !== currentStatus) return [];
    const server = ata.preenchido_por || primaryServerName(item);
    if (filledBy && !normalized(server).includes(normalized(filledBy))) return [];

    return [{
      id: ata.ata_id,
      groupId: item.grupo.grupo_id,
      groupName: item.grupo.grupo_nome,
      date: ata.data_reuniao,
      time: ata.hora_inicio,
      index: ataNumbers.get(ata.ata_id) ?? null,
      server,
      status: currentStatus,
      sourcePosition: responsiblePositions.get(ata.ata_id) ?? sourcePosition,
    }];
  });

  if (source === "direto") {
    rows.sort((first, second) => second.date.localeCompare(first.date)
      || second.time.localeCompare(first.time)
      || compareNumber(second.index, first.index)
      || second.sourcePosition - first.sourcePosition);
  } else {
    rows = sortAtas(rows, source, order);
  }

  const currentIndex = rows.findIndex((row) => row.id === currentAtaId);
  const params = new URLSearchParams();
  params.set("origem", source === "direto" ? "direto" : source);
  if (source !== "direto") {
    for (const key of ["de", "ate", "horario", "status", "grupo", "preenchido", "ordem"]) {
      const value = queryValue(searchParams, key);
      if (value !== undefined) params.set(key, value);
    }
  }
  const query = `?${params.toString()}`;

  return {
    previousId: currentIndex > 0 ? rows[currentIndex - 1]?.id : undefined,
    nextId: currentIndex >= 0 ? rows[currentIndex + 1]?.id : undefined,
    query,
  };
}
