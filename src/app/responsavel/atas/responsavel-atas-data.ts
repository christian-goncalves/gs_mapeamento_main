import type { AggregatedAta } from "@/domain/aggregate";
import type { Grupo, GrupoHorario } from "@/domain/entities";

export type ResponsavelAtaStatus = "Enviada" | "Não enviada" | "Pendente de revisão";

export type ResponsavelAtaRow = {
  ataId: string | null;
  indicePersonalizadoGrupo: number | null;
  data: string;
  horario: string;
  servidor: string;
  status: ResponsavelAtaStatus;
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

function dateRange(start: string, end: string) {
  const dates: string[] = [];
  const current = new Date(`${start}T00:00:00.000Z`);
  const final = new Date(`${end}T00:00:00.000Z`);

  while (current <= final) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function dateTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return {
    year: values.year ?? "0000",
    month: values.month ?? "00",
    day: values.day ?? "00",
    hour: values.hour ?? "00",
    minute: values.minute ?? "00",
    second: values.second ?? "00",
  };
}

function meetingStart(data: string, horario: string, timeZone: string) {
  const desired = `${data}T${horario}:00`;
  let instant = new Date(`${desired}Z`);

  // Resolve the local meeting time to an instant without depending on the server timezone.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = dateTimeParts(instant, timeZone);
    const represented = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
    const difference = Date.parse(`${desired}Z`) - Date.parse(`${represented}Z`);
    if (!difference) break;
    instant = new Date(instant.getTime() + difference);
  }

  return instant;
}

function hasMeetingEnded(data: string, horario: string, timeZone: string, now: Date) {
  const end = meetingStart(data, horario, timeZone).getTime() + 2 * 60 * 60 * 1000;
  return now.getTime() >= end;
}

function scheduleWasValidAt(
  schedule: GrupoHorario,
  meeting: Date,
) {
  const createdAt = Date.parse(schedule.created_at);
  const updatedAt = Date.parse(schedule.updated_at);
  return Number.isFinite(createdAt) && Number.isFinite(updatedAt)
    && createdAt <= meeting.getTime()
    && updatedAt <= meeting.getTime();
}

function primaryServerName(servers: { nome: string; ordem: number }[]) {
  return [...servers].sort((first, second) => first.ordem - second.ordem)[0]?.nome ?? "";
}

function ataKey(data: string, horario: string) {
  return `${data}|${horario}`;
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
  const groupAtas = atas.filter(
    (item) => item.grupo.grupo_id === group.grupo_id
      && item.registro.ata.status_registro === "ativa",
  );
  const rows: ResponsavelAtaRow[] = groupAtas.map((item) => {
    const { ata } = item.registro;
    return {
      ataId: ata.ata_id,
      indicePersonalizadoGrupo: ata.indice_personalizado_grupo,
      data: ata.data_reuniao,
      horario: ata.hora_inicio,
      servidor: ata.preenchido_por || primaryServerName(item.registro.servidores),
      status: ata.status_aprovacao === "pendente_revisao" ? "Pendente de revisão" : "Enviada",
    };
  });

  const receivedMeetings = new Set(rows.map((row) => ataKey(row.data, row.horario)));
  const groupSchedules = horarios.filter(
    (schedule) => schedule.grupo_id === group.grupo_id && schedule.ativo,
  );
  const earliestScheduleDate = groupSchedules
    .map((schedule) => {
      const createdAt = dateTimeParts(new Date(schedule.created_at), group.fuso_horario);
      return `${createdAt.year}-${createdAt.month}-${createdAt.day}`;
    })
    .sort()[0];

  if (earliestScheduleDate) {
    const today = dateTimeParts(now, group.fuso_horario);
    const endDate = `${today.year}-${today.month}-${today.day}`;

    for (const data of dateRange(earliestScheduleDate, endDate)) {
      const weekday = weekDayByIndex[new Date(`${data}T00:00:00.000Z`).getUTCDay()];

      for (const schedule of groupSchedules) {
        if (schedule.dia_semana !== weekday) continue;

        const meeting = meetingStart(data, schedule.hora_inicio, group.fuso_horario);
        const key = ataKey(data, schedule.hora_inicio);
        if (
          receivedMeetings.has(key)
          || !scheduleWasValidAt(schedule, meeting)
          || !hasMeetingEnded(data, schedule.hora_inicio, group.fuso_horario, now)
        ) continue;

        receivedMeetings.add(key);
        rows.push({
          ataId: null,
          indicePersonalizadoGrupo: null,
          data,
          horario: schedule.hora_inicio,
          servidor: "",
          status: "Não enviada",
        });
      }
    }
  }

  return rows.sort(
    (first, second) => second.data.localeCompare(first.data)
      || second.horario.localeCompare(first.horario)
      || (second.indicePersonalizadoGrupo ?? 0) - (first.indicePersonalizadoGrupo ?? 0),
  );
}
