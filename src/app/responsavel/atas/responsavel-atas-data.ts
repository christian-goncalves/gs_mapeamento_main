import type { AggregatedAta } from "@/domain/aggregate";
import { deriveAtaNumbers } from "@/domain/ata-numbering";
import type { Grupo, GrupoHorario } from "@/domain/entities";
import { buildMissingAtaOccurrences, nextMissingAtaRefreshAt } from "@/domain/missing-ata-occurrences";
import { convertLocalMeetingToBrasilia } from "@/domain/time-zones";

export type ResponsavelAtaStatus = "Enviada" | "Não enviada" | "Pendente de revisão" | "Substituída" | "Excluída";
export type ResponsavelAtaRegistroStatus = "ativa" | "substituida" | "excluida";

export type ResponsavelAtaRow = {
  ataId: string | null;
  numeroAta: number | null;
  data: string;
  horario: string;
  servidor: string;
  status: ResponsavelAtaStatus;
  registroStatus: ResponsavelAtaRegistroStatus;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
};

export function meetingStart(data: string, horario: string, timeZone: string) {
  return convertLocalMeetingToBrasilia(data, horario, timeZone).instant;
}

export function meetingInBrasilia(data: string, horario: string, sourceTimeZone: string) {
  return convertLocalMeetingToBrasilia(data, horario, sourceTimeZone);
}

function primaryServerName(servers: { nome: string; ordem: number }[]) {
  return [...servers].sort((first, second) => first.ordem - second.ordem)[0]?.nome ?? "";
}

export function buildResponsavelAtaRows({
  group,
  atas,
  horarios,
  now = new Date(),
}: {
  group: Grupo;
  atas: AggregatedAta[];
  horarios: GrupoHorario[];
  now?: Date;
}): ResponsavelAtaRow[] {
  const ataNumbers = deriveAtaNumbers(atas);
  const groupAtas = atas.filter(
    (item) => item.grupo.grupo_id === group.grupo_id,
  );
  const rows: ResponsavelAtaRow[] = groupAtas.map((item) => {
    const { ata } = item.registro;
    const registroStatus = ata.status_registro ?? "ativa";
    const approvalStatus = ata.status_aprovacao ?? "aprovada";
    const status = registroStatus === "substituida"
      ? "Substituída"
      : registroStatus === "excluida"
        ? "Excluída"
        : approvalStatus === "pendente_revisao"
          ? "Pendente de revisão"
          : "Enviada";
    return {
      ataId: ata.ata_id,
      numeroAta: ataNumbers.get(ata.ata_id) ?? null,
      data: ata.data_reuniao,
      horario: ata.hora_inicio,
      servidor: ata.preenchido_por || primaryServerName(item.registro.servidores),
      status,
      registroStatus,
      updatedAt: ata.updated_at,
      canEdit: registroStatus === "ativa"
        && ["aprovada", "pendente_revisao"].includes(approvalStatus),
      canDelete: registroStatus === "ativa" && approvalStatus === "aprovada",
    };
  });

  const missingOccurrences = buildMissingAtaOccurrences({
    groups: [group],
    schedules: horarios,
    receivedMeetings: rows
      .filter((row) => row.registroStatus === "ativa")
      .map((row) => ({ groupId: group.grupo_id, date: row.data, time: row.horario })),
    now,
  });
  rows.push(...missingOccurrences.map((occurrence) => ({
    ataId: null,
    numeroAta: null,
    data: occurrence.date,
    horario: occurrence.time,
    servidor: "",
    status: "Não enviada" as const,
    registroStatus: "ativa" as const,
    updatedAt: "",
    canEdit: false,
    canDelete: false,
  })));

  return rows.sort(
    (first, second) => second.data.localeCompare(first.data)
      || second.horario.localeCompare(first.horario)
      || (second.numeroAta ?? 0) - (first.numeroAta ?? 0),
  );
}

export function nextResponsavelMissingAtaRefreshAt({
  group,
  atas,
  horarios,
  now = new Date(),
}: {
  group: Grupo;
  atas: AggregatedAta[];
  horarios: GrupoHorario[];
  now?: Date;
}) {
  return nextMissingAtaRefreshAt({
    groups: [group],
    schedules: horarios,
    receivedMeetings: atas
      .filter((item) => item.grupo.grupo_id === group.grupo_id && (item.registro.ata.status_registro ?? "ativa") === "ativa")
      .map((item) => ({
        groupId: group.grupo_id,
        date: item.registro.ata.data_reuniao,
        time: item.registro.ata.hora_inicio,
      })),
    now,
  });
}
