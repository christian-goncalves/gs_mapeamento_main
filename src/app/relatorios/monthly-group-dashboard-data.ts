import type { AggregatedAta, AggregatedRead } from "@/domain/aggregate";
import type { Grupo, GrupoHorario, GrupoServidorMesa } from "@/domain/entities";
import {
  activeMesaServersForGroup,
  isVacantMesaName,
} from "@/domain/grupo-servidores-mesa";
import { tempoLimpoMapping, type TempoLimpo } from "@/domain/enums";
import { roundPresenceAverage } from "./presence-average";

export type MonthlyDashboardFilters = {
  grupoId: string;
  month: number;
  year: number;
};

export type MonthlyDashboardData = ReturnType<typeof buildMonthlyDashboardData>;

export type ResponsavelMeetingSchedule = {
  time: string;
  presences: number;
  ingressos: number;
};

export type ResponsavelMeetingWeekday = {
  weekday: string;
  presences: number;
  averagePresences: number;
  ingressos: number;
  schedules: ResponsavelMeetingSchedule[];
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

const achievementOrder: TempoLimpo[] = [
  "dias_30",
  "dias_60",
  "dias_90",
  "meses_6",
  "meses_9",
  "ano_1",
  "meses_18",
  "multiplos_anos",
];

export const achievementColors: Record<TempoLimpo | "ingresso", string> = {
  ingresso: "#FFFFFF",
  dias_30: "#FAA514",
  dias_60: "#77D46C",
  dias_90: "#F24449",
  meses_6: "#5F8DDD",
  meses_9: "#F7F838",
  ano_1: "#DFDEDF",
  meses_18: "#A1A0A0",
  multiplos_anos: "#272727",
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { start: isoDate(start), end: isoDate(end) };
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

function weekdayIndex(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function meetingKey(grupoId: string, data: string, horario: string) {
  return `${grupoId}|${data}|${horario}`;
}

function roundAverage(total: number, count: number) {
  if (count <= 0) return 0;
  return Math.round(total / count);
}

function activeSchedulesForGroup(
  horarios: readonly GrupoHorario[],
  grupoId: string,
) {
  return horarios
    .filter((horario) => horario.grupo_id === grupoId && horario.ativo)
    .sort(
      (first, second) =>
        first.dia_semana.localeCompare(second.dia_semana) ||
        first.hora_inicio.localeCompare(second.hora_inicio),
    );
}

function expectedMeetings(
  group: Grupo,
  schedules: readonly GrupoHorario[],
  start: string,
  end: string,
) {
  return dateRange(start, end).flatMap((data) => {
    const dayName = weekDayByIndex[new Date(`${data}T00:00:00.000Z`).getUTCDay()];
    return schedules
      .filter((horario) => horario.dia_semana === dayName)
      .map((horario) => ({
        grupoId: group.grupo_id,
        data,
        horario: horario.hora_inicio,
        key: meetingKey(group.grupo_id, data, horario.hora_inicio),
      }));
  });
}

function monthAtas(atas: readonly AggregatedAta[], filters: MonthlyDashboardFilters) {
  const monthKey = `${filters.year}-${String(filters.month).padStart(2, "0")}`;
  return atas.filter(
    (item) =>
      item.registro.ata.status_registro === "ativa" &&
      item.grupo.grupo_id === filters.grupoId &&
      item.registro.ata.data_reuniao.startsWith(monthKey),
  );
}

function distinctCountries(atas: readonly AggregatedAta[]) {
  return new Set(
    atas.flatMap((item) =>
      item.registro.participacao.map((row) =>
        row.pais.trim().toLocaleLowerCase("pt-BR"),
      ),
    ).filter(Boolean),
  ).size;
}

function distinctCities(atas: readonly AggregatedAta[]) {
  return new Set(
    atas.flatMap((item) => item.registro.participacao)
      .filter((row) => row.localidade.trim())
      .map((row) =>
        `${row.localidade.trim()}|${row.estado.trim()}|${row.pais.trim()}`
          .toLocaleLowerCase("pt-BR"),
      ),
  ).size;
}

function distinctStates(atas: readonly AggregatedAta[]) {
  return new Set(
    atas.flatMap((item) => item.registro.participacao)
      .map((row) => row.estado.trim().toLocaleLowerCase("pt-BR"))
      .filter(Boolean),
  ).size;
}

function distinctOtherCountries(atas: readonly AggregatedAta[]) {
  return new Set(
    atas.flatMap((item) => item.registro.participacao)
      .map((row) => row.pais.trim().toLocaleLowerCase("pt-BR"))
      .filter((country) => country && country !== "brasil"),
  ).size;
}

function achievements(atas: readonly AggregatedAta[], ingressos: number) {
  const values = Object.fromEntries(
    achievementOrder.map((code) => [code, 0]),
  ) as Record<TempoLimpo, number>;
  for (const ata of atas) {
    for (const troca of ata.registro.trocas_chaveiro) {
      values[troca.tempo_limpo] += troca.quantidade;
    }
  }
  const rows = achievementOrder.map((code) => ({
    code,
    label: tempoLimpoMapping.toSheet(code),
    value: values[code],
    color: achievementColors[code],
  }));
  const subtotal = rows.reduce((total, row) => total + row.value, 0);
  return {
    ingresso: {
      label: "Ingresso",
      value: ingressos,
      color: achievementColors.ingresso,
    },
    rows,
    subtotal,
    total: subtotal + ingressos,
  };
}

function mesaRows(servidores: readonly GrupoServidorMesa[], grupoId: string) {
  const active = activeMesaServersForGroup(servidores, grupoId);
  return active.map((item) => ({
    encargo: item.encargo,
    nome: item.nome,
    data_inicio: item.data_inicio,
    vacant: isVacantMesaName(item.nome),
  }));
}

export function buildMonthlyDashboardData(
  result: AggregatedRead,
  filters: MonthlyDashboardFilters,
) {
  const group = result.grupos.find((item) => item.grupo_id === filters.grupoId);
  if (!group) throw new Error("Grupo não encontrado.");

  const { start, end } = monthRange(filters.month, filters.year);
  const schedules = activeSchedulesForGroup(
    result.grupo_horarios,
    filters.grupoId,
  );
  const expected = expectedMeetings(group, schedules, start, end);
  const receivedAtas = monthAtas(result.atas, filters);
  const sentAtas = receivedAtas.filter(
    (item) => item.registro.ata.status_aprovacao === "aprovada",
  );
  const responsavelAtas = receivedAtas.filter(
    (item) =>
      item.registro.ata.status_aprovacao === "aprovada" ||
      item.registro.ata.status_aprovacao === "pendente_revisao",
  );
  const approvedHistoricalMeetings = new Set(
    result.atas
      .filter(
        (item) =>
          item.grupo.grupo_id === filters.grupoId &&
          item.registro.ata.status_registro === "ativa" &&
          item.registro.ata.status_aprovacao === "aprovada",
      )
      .map((item) =>
        meetingKey(
          item.grupo.grupo_id,
          item.registro.ata.data_reuniao,
          item.registro.ata.hora_inicio,
        ),
      ),
  ).size;
  const sentKeys = new Set(
    receivedAtas.map((item) =>
      meetingKey(
        item.grupo.grupo_id,
        item.registro.ata.data_reuniao,
        item.registro.ata.hora_inicio,
      ),
    ),
  );
  const missingMeetings = expected.filter((item) => !sentKeys.has(item.key));
  const totalPresencas = sentAtas.reduce(
    (total, item) => total + item.registro.ata.total_membros_presentes,
    0,
  );
  const totalIngressos = sentAtas.reduce(
    (total, item) => total + item.registro.ingressos.length,
    0,
  );
  const totalLocalidades = sentAtas.reduce(
    (total, item) => total + item.indicadores.total_localidades,
    0,
  );
  const totalEstados = sentAtas.reduce(
    (total, item) => total + item.indicadores.total_estados,
    0,
  );
  const horarios = [...new Set(schedules.map((item) => item.hora_inicio))].sort();
  const meetingResults = [...sentAtas]
    .sort((first, second) =>
      second.registro.ata.data_reuniao.localeCompare(first.registro.ata.data_reuniao) ||
      second.registro.ata.hora_inicio.localeCompare(first.registro.ata.hora_inicio),
    )
    .map((item) => ({
      id: item.registro.ata.ata_id,
      date: item.registro.ata.data_reuniao,
      time: item.registro.ata.hora_inicio,
      presences: item.registro.ata.total_membros_presentes,
      ingressos: item.registro.ingressos.length,
      achievements: item.registro.trocas_chaveiro.reduce(
        (total, troca) => total + troca.quantidade,
        0,
      ),
    }));

  const responsavelMeetingResults: ResponsavelMeetingWeekday[] = weekDayByIndex.map(
    (weekday, index) => {
      const weekdayAtas = responsavelAtas.filter(
        (item) => weekdayIndex(item.registro.ata.data_reuniao) === index,
      );
      const dayTimes = [
        ...new Set(
          schedules
            .filter((schedule) => schedule.dia_semana === weekday)
            .map((schedule) => schedule.hora_inicio),
        ),
      ].sort();
      const scheduleResults = dayTimes.map((time) => {
        const timeAtas = weekdayAtas.filter(
          (item) => item.registro.ata.hora_inicio === time,
        );
        return {
          time,
          presences: timeAtas.reduce(
            (total, item) => total + item.registro.ata.total_membros_presentes,
            0,
          ),
          ingressos: timeAtas.reduce(
            (total, item) => total + item.registro.ingressos.length,
            0,
          ),
        };
      });
      const presences = weekdayAtas.reduce(
        (total, item) => total + item.registro.ata.total_membros_presentes,
        0,
      );
      return {
        weekday,
        presences,
        averagePresences: weekdayAtas.length
          ? Math.round(presences / weekdayAtas.length)
          : 0,
        ingressos: weekdayAtas.reduce(
          (total, item) => total + item.registro.ingressos.length,
          0,
        ),
        schedules: scheduleResults,
      };
    },
  );

  return {
    group,
    filters,
    period: { start, end },
    sentAtasCount: sentAtas.length,
    consolidated: {
      reunioesDesdeFundacao:
        group.ultima_reuniao_anterior + approvedHistoricalMeetings,
      totalReunioes: expected.length,
      reunioesSemAtaOuSalaFechada: missingMeetings.length,
      totalPresencas,
      mediaPresencas: roundAverage(totalPresencas, sentAtas.length),
      mediaPresencasResponsavel: roundPresenceAverage(totalPresencas, sentAtas.length),
      visitantes: sentAtas.reduce(
        (total, item) => total + item.registro.visitantes.length,
        0,
      ),
      mediaLocalidades: roundAverage(totalLocalidades, sentAtas.length),
      mediaEstados: roundAverage(totalEstados, sentAtas.length),
      totalPaises: distinctCountries(sentAtas),
      totalCidades: distinctCities(sentAtas),
      totalEstadosUnicos: distinctStates(sentAtas),
      totalOutrosPaises: distinctOtherCountries(sentAtas),
      ingressos: totalIngressos,
    },
    bySchedule: {
      horarios,
      mediaParticipantes: horarios.map((horario) => {
        const rows = sentAtas.filter(
          (item) => item.registro.ata.hora_inicio === horario,
        );
        return roundAverage(
          rows.reduce(
            (total, item) =>
              total + item.registro.ata.total_membros_presentes,
            0,
          ),
          rows.length,
        );
      }),
      ingressos: horarios.map((horario) =>
        sentAtas
          .filter((item) => item.registro.ata.hora_inicio === horario)
          .reduce((total, item) => total + item.registro.ingressos.length, 0),
      ),
      totalMediaParticipantes: roundAverage(totalPresencas, sentAtas.length),
      totalIngressos,
    },
    meetingResults,
    responsavelMeetingResults,
    achievements: achievements(sentAtas, totalIngressos),
    mesa: mesaRows(result.grupo_servidores_mesa, filters.grupoId),
  };
}

export function dashboardYears(result: AggregatedRead) {
  const currentYear = new Date().getFullYear();
  const years = new Set<number>([currentYear]);
  for (const ata of result.atas) {
    if (ata.registro.ata.status_registro !== "ativa" || ata.registro.ata.status_aprovacao !== "aprovada") continue;
    years.add(Number(ata.registro.ata.data_reuniao.slice(0, 4)));
  }
  return [...years].filter(Number.isFinite).sort((first, second) => second - first);
}
