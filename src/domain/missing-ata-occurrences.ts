import type { Grupo, GrupoHorario } from "./entities";
import { convertLocalMeetingToBrasilia, dateTimePartsInZone } from "./time-zones";

const weekdays = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"] as const;
const missingDelayMs = 2 * 60 * 60 * 1000;

export type ReceivedMeetingKey = { groupId: string; date: string; time: string };
export type MissingAtaOccurrence = ReceivedMeetingKey & { start: Date };

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateInBrasilia(date: Date) {
  const parts = dateTimePartsInZone(date, "America/Sao_Paulo");
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function scheduleWasValidAt(schedule: GrupoHorario, meeting: Date) {
  const createdAt = Date.parse(schedule.created_at);
  const updatedAt = Date.parse(schedule.updated_at);
  const meetingDate = dateInBrasilia(meeting);
  return Number.isFinite(createdAt) && Number.isFinite(updatedAt)
    && dateInBrasilia(new Date(createdAt)) <= meetingDate
    && dateInBrasilia(new Date(updatedAt)) <= meetingDate;
}

function earliestScheduleDate(schedules: GrupoHorario[]) {
  return schedules
    .map((schedule) => Date.parse(schedule.created_at))
    .filter(Number.isFinite)
    .map((createdAt) => dateInBrasilia(new Date(createdAt)))
    .sort()[0];
}

function activeMeetingKeys(meetings: readonly ReceivedMeetingKey[]) {
  return new Set(meetings.map(({ groupId, date, time }) => `${groupId}|${date}|${time}`));
}

export function buildMissingAtaOccurrences({
  groups,
  schedules,
  receivedMeetings,
  now = new Date(),
  fromDate,
}: {
  groups: Grupo[];
  schedules: GrupoHorario[];
  receivedMeetings: readonly ReceivedMeetingKey[];
  now?: Date;
  fromDate?: string;
}): MissingAtaOccurrence[] {
  const throughDate = dateInBrasilia(now);
  const receivedKeys = activeMeetingKeys(receivedMeetings);
  const rows = new Map<string, MissingAtaOccurrence>();

  for (const group of groups) {
    const groupSchedules = schedules.filter(
      (schedule) => schedule.grupo_id === group.grupo_id && schedule.ativo,
    );
    const firstScheduleDate = earliestScheduleDate(groupSchedules);
    if (!firstScheduleDate) continue;
    const startDate = fromDate && fromDate > firstScheduleDate ? fromDate : firstScheduleDate;
    const sourceStart = addDays(startDate, -1);
    const sourceEnd = addDays(throughDate, 1);

    for (let sourceDate = sourceStart; sourceDate <= sourceEnd; sourceDate = addDays(sourceDate, 1)) {
      const weekday = weekdays[new Date(`${sourceDate}T00:00:00.000Z`).getUTCDay()];
      for (const schedule of groupSchedules) {
        if (schedule.dia_semana !== weekday) continue;
        const converted = convertLocalMeetingToBrasilia(sourceDate, schedule.hora_inicio, group.fuso_horario);
        const meetingKey = `${group.grupo_id}|${converted.data}|${converted.horario}`;
        if (
          receivedKeys.has(meetingKey)
          || converted.data < startDate
          || converted.data > throughDate
          || !scheduleWasValidAt(schedule, converted.instant)
          || now.getTime() < converted.instant.getTime() + missingDelayMs
        ) continue;

        rows.set(meetingKey, {
          groupId: group.grupo_id,
          date: converted.data,
          time: converted.horario,
          start: converted.instant,
        });
      }
    }
  }

  return [...rows.values()].sort((first, second) =>
    second.date.localeCompare(first.date) || second.time.localeCompare(first.time) || first.groupId.localeCompare(second.groupId),
  );
}

export function nextMissingAtaRefreshAt({
  groups,
  schedules,
  receivedMeetings,
  now = new Date(),
}: {
  groups: Grupo[];
  schedules: GrupoHorario[];
  receivedMeetings: readonly ReceivedMeetingKey[];
  now?: Date;
}): string | undefined {
  const receivedKeys = activeMeetingKeys(receivedMeetings);
  const currentDate = dateInBrasilia(now);
  const searchStart = addDays(currentDate, -1);
  const searchEnd = addDays(currentDate, 8);
  let nextRefreshAt: number | undefined;

  for (const group of groups) {
    const groupSchedules = schedules.filter(
      (schedule) => schedule.grupo_id === group.grupo_id && schedule.ativo,
    );
    if (!groupSchedules.length) continue;

    for (let sourceDate = searchStart; sourceDate <= searchEnd; sourceDate = addDays(sourceDate, 1)) {
      const weekday = weekdays[new Date(`${sourceDate}T00:00:00.000Z`).getUTCDay()];
      for (const schedule of groupSchedules) {
        if (schedule.dia_semana !== weekday) continue;
        const converted = convertLocalMeetingToBrasilia(sourceDate, schedule.hora_inicio, group.fuso_horario);
        const key = `${group.grupo_id}|${converted.data}|${converted.horario}`;
        const threshold = converted.instant.getTime() + missingDelayMs;
        if (
          receivedKeys.has(key)
          || threshold <= now.getTime()
          || !scheduleWasValidAt(schedule, converted.instant)
          || (nextRefreshAt !== undefined && threshold >= nextRefreshAt)
        ) continue;
        nextRefreshAt = threshold;
      }
    }
  }

  return nextRefreshAt === undefined ? undefined : new Date(nextRefreshAt).toISOString();
}
