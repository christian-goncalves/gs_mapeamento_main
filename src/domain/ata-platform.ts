import type { GrupoHorario, GrupoPlataforma } from "./schemas";
import type { FusoHorario, Plataforma } from "./enums";
import { convertLocalMeetingToBrasilia } from "./time-zones";

const weekdays = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

export type AtaPlatformErrorCode =
  | "duplicate_schedule"
  | "recurring_platform_unavailable"
  | "extra_platform_unavailable";

export function ataPlatformErrorMessage(code: AtaPlatformErrorCode) {
  const messages: Record<AtaPlatformErrorCode, string> = {
    duplicate_schedule: "A agenda deste grupo tem horários duplicados para esta reunião. A ata não foi enviada; peça a correção da agenda.",
    recurring_platform_unavailable: "Este horário recorrente ainda não tem uma plataforma configurada. Peça ao administrador do grupo para concluir a associação antes de enviar a ata.",
    extra_platform_unavailable: "Selecione uma plataforma ativa do grupo para esta reunião extra.",
  };
  return messages[code];
}

export function getAtaPlatformPreflightError({
  matchingScheduleCount,
  recurringPlatformType,
  explicitPlatformConfirmed,
  activePlatformTypes,
  selectedPlatform,
}: {
  matchingScheduleCount: number;
  recurringPlatformType?: Plataforma;
  explicitPlatformConfirmed: boolean;
  activePlatformTypes: readonly Plataforma[];
  selectedPlatform: Plataforma;
}): AtaPlatformErrorCode | undefined {
  if (matchingScheduleCount > 1) return "duplicate_schedule";
  if (matchingScheduleCount === 1 && !recurringPlatformType) return "recurring_platform_unavailable";
  if (matchingScheduleCount === 0 && (!explicitPlatformConfirmed || !activePlatformTypes.includes(selectedPlatform))) {
    return "extra_platform_unavailable";
  }
  return undefined;
}

export class AtaPlatformResolutionError extends Error {
  constructor(readonly code: AtaPlatformErrorCode) {
    super(ataPlatformErrorMessage(code));
    this.name = "AtaPlatformResolutionError";
  }
}

export function findRecurringAtaSchedules<T extends Pick<GrupoHorario, "grupo_id" | "ativo" | "dia_semana" | "hora_inicio">>({
  groupId,
  timeZone,
  date,
  time,
  schedules,
}: {
  groupId: string;
  timeZone: FusoHorario;
  date: string;
  time: string;
  schedules: readonly T[];
}) {
  return schedules.filter((schedule) => {
    if (!schedule.ativo || schedule.grupo_id !== groupId) return false;
    for (const shift of [-1, 0, 1]) {
      const candidate = new Date(`${date}T00:00:00.000Z`);
      candidate.setUTCDate(candidate.getUTCDate() + shift);
      const sourceDate = candidate.toISOString().slice(0, 10);
      if (weekdays[new Date(`${sourceDate}T00:00:00.000Z`).getUTCDay()] !== schedule.dia_semana) continue;
      const converted = convertLocalMeetingToBrasilia(sourceDate, schedule.hora_inicio, timeZone);
      if (converted.data === date && converted.horario === time) return true;
    }
    return false;
  });
}

export function resolveAtaPlatform({
  groupId,
  timeZone,
  date,
  time,
  schedules,
  platforms,
  explicitPlatform,
}: {
  groupId: string;
  timeZone: FusoHorario;
  date: string;
  time: string;
  schedules: readonly GrupoHorario[];
  platforms: readonly GrupoPlataforma[];
  explicitPlatform: Plataforma;
}) {
  const matchingSchedules = findRecurringAtaSchedules({ groupId, timeZone, date, time, schedules });
  if (matchingSchedules.length > 1) throw new AtaPlatformResolutionError("duplicate_schedule");
  const activePlatforms = platforms.filter((platform) => platform.ativo && platform.grupo_id === groupId);
  if (matchingSchedules.length === 1) {
    const platformId = matchingSchedules[0].plataforma_id;
    const platform = activePlatforms.find((item) => item.plataforma_id === platformId);
    if (!platform) throw new AtaPlatformResolutionError("recurring_platform_unavailable");
    return { type: platform.tipo, extra: false };
  }
  if (!activePlatforms.some((platform) => platform.tipo === explicitPlatform)) {
    throw new AtaPlatformResolutionError("extra_platform_unavailable");
  }
  return { type: explicitPlatform, extra: true };
}
