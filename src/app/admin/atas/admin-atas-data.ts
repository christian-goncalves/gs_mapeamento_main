import type { AggregatedAta } from "@/domain/aggregate";
import type { Grupo, GrupoHorario } from "@/domain/entities";

export type AdminAtaStatus = "Enviada" | "Não enviada" | "Pendente de revisão";

export type AdminAtaRow = {
  ataId: string;
  indicePersonalizadoGrupo: number | null;
  data: string;
  horario: string;
  grupoId: string;
  grupo: string;
  preenchidoPor: string;
  status: AdminAtaStatus;
};

const weekDayByIndex = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
] as const;

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthStart(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

export function currentMonthPeriod(reference = new Date()) {
  const start = monthStart(reference);
  const today = new Date(Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate(),
  ));

  return {
    start: isoDate(start),
    end: isoDate(today),
    key: isoDate(start).slice(0, 7),
  };
}

function dateRange(start: string, end: string) {
  const dates: string[] = [];
  const current = new Date(`${start}T00:00:00.000Z`);
  const final = new Date(`${end}T00:00:00.000Z`);
  while (current <= final) {
    dates.push(isoDate(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function ataKey(row: Pick<AdminAtaRow, "grupoId" | "data" | "horario">) {
  return `${row.grupoId}|${row.data}|${row.horario}`;
}

export function primaryServerName(servers: { nome: string; ordem: number }[]) {
  return [...servers].sort((first, second) => first.ordem - second.ordem)[0]?.nome ?? "";
}

export function buildSentAtaRows(atas: AggregatedAta[]): AdminAtaRow[] {
  return atas.map((item) => {
    const { ata } = item.registro;
    return {
      ataId: ata.ata_id,
      indicePersonalizadoGrupo: ata.indice_personalizado_grupo,
      data: ata.data_reuniao,
      horario: ata.hora_inicio,
      grupoId: item.grupo.grupo_id,
      grupo: item.grupo.grupo_nome,
      preenchidoPor: ata.preenchido_por || primaryServerName(item.registro.servidores),
      status: "Enviada",
    };
  });
}

export function buildMissingAtaRows({
  grupos,
  horarios,
  sentRows,
  start,
  end,
}: {
  grupos: Grupo[];
  horarios: GrupoHorario[];
  sentRows: AdminAtaRow[];
  start: string;
  end: string;
}): AdminAtaRow[] {
  const groupsById = new Map(grupos.map((group) => [group.grupo_id, group]));
  const sentKeys = new Set(sentRows.map(ataKey));
  const rows: AdminAtaRow[] = [];

  for (const data of dateRange(start, end)) {
    const dayName = weekDayByIndex[new Date(`${data}T00:00:00.000Z`).getUTCDay()];
    for (const horario of horarios) {
      if (!horario.ativo || horario.dia_semana !== dayName) continue;
      const group = groupsById.get(horario.grupo_id);
      if (!group) continue;

      const row: AdminAtaRow = {
        ataId: "",
        indicePersonalizadoGrupo: null,
        data,
        horario: horario.hora_inicio,
        grupoId: group.grupo_id,
        grupo: group.grupo_nome,
        preenchidoPor: "",
        status: "Não enviada",
      };
      if (!sentKeys.has(ataKey(row))) rows.push(row);
    }
  }

  return rows.sort(
    (first, second) =>
      second.data.localeCompare(first.data) ||
      first.horario.localeCompare(second.horario) ||
      first.grupo.localeCompare(second.grupo, "pt-BR"),
  );
}
