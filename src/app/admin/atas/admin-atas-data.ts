import type { AggregatedAta } from "@/domain/aggregate";
import type { Grupo, GrupoHorario } from "@/domain/entities";
import { buildMissingAtaOccurrences } from "@/domain/missing-ata-occurrences";

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

export function primaryServerName(servers: { nome: string; ordem: number }[]) {
  return [...servers].sort((first, second) => first.ordem - second.ordem)[0]?.nome ?? "";
}

export function buildSentAtaRows(atas: AggregatedAta[]): AdminAtaRow[] {
  return atas
    .filter((item) => item.registro.ata.status_registro === "ativa")
    .map((item) => {
      const { ata } = item.registro;
      return {
        ataId: ata.ata_id,
        indicePersonalizadoGrupo: ata.indice_personalizado_grupo,
        data: ata.data_reuniao,
        horario: ata.hora_inicio,
        grupoId: item.grupo.grupo_id,
        grupo: item.grupo.grupo_nome,
        preenchidoPor: ata.preenchido_por || primaryServerName(item.registro.servidores),
        status: ata.status_aprovacao === "pendente_revisao"
          ? "Pendente de revisão"
          : "Enviada",
      };
    });
}

export function buildMissingAtaRows({
  grupos,
  horarios,
  sentRows,
  start,
  end,
  now = new Date(),
}: {
  grupos: Grupo[];
  horarios: GrupoHorario[];
  sentRows: AdminAtaRow[];
  start: string;
  end: string;
  now?: Date;
}): AdminAtaRow[] {
  const groupsById = new Map(grupos.map((group) => [group.grupo_id, group]));
  const occurrences = buildMissingAtaOccurrences({
    groups: grupos,
    schedules: horarios,
    receivedMeetings: sentRows.map((row) => ({
      groupId: row.grupoId,
      date: row.data,
      time: row.horario,
    })),
    now,
    fromDate: start,
  });

  return occurrences
    .filter((occurrence) => occurrence.date <= end)
    .flatMap((occurrence) => {
      const group = groupsById.get(occurrence.groupId);
      return group ? [{
        ataId: "",
        indicePersonalizadoGrupo: null,
        data: occurrence.date,
        horario: occurrence.time,
        grupoId: group.grupo_id,
        grupo: group.grupo_nome,
        preenchidoPor: "",
        status: "Não enviada" as const,
      }] : [];
    })
    .sort(
      (first, second) =>
        second.data.localeCompare(first.data) ||
        first.horario.localeCompare(second.horario) ||
        first.grupo.localeCompare(second.grupo, "pt-BR"),
    );
}
