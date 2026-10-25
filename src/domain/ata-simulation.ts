import { randomBytes } from "node:crypto";
import { z } from "zod";
import countriesDocument from "../../data/paises.json";
import {
  categoriaVisitanteMapping,
  origemContatoMapping,
  servidorFuncoesSimulacao,
  tempoLimpoMapping,
} from "./enums";
import {
  ataSubmissionSchema,
  type AtaSubmission,
} from "./form-schemas";
import {
  municipioDocument,
  isMunicipioOption,
  municipioOption,
} from "./municipios";
import {
  diaSemanaSchema,
  type Grupo,
  type GrupoHorario,
} from "./schemas";

export type SimulationInput = {
  grupo: string;
  mes: number;
  ano: number;
  servidores: string[];
  seed?: string | number;
};

export type AtaBusinessKey = {
  grupo_id: string;
  data_reuniao: string;
  hora_inicio: string;
};

export type SimulationMeeting = {
  data_reuniao: string;
  hora_inicio: string;
  dia_semana: GrupoHorario["dia_semana"];
};

export type SimulationPlan = {
  input: {
    grupo: string;
    mes: number;
    ano: number;
    servidores: string[];
    seed: string;
  };
  grupo: Pick<Grupo, "grupo_id" | "grupo_nome" | "ativo">;
  horarios: Pick<
    GrupoHorario,
    "horario_id" | "dia_semana" | "hora_inicio" | "ativo"
  >[];
  meetings: SimulationMeeting[];
  submissions: AtaSubmission[];
  conflicts: AtaBusinessKey[];
  validations: string[];
};

export class SimulationConflictError extends Error {
  constructor(public readonly conflicts: AtaBusinessKey[]) {
    super(
      `A simulação mensal conflita com ${conflicts.length} ata(s) existente(s).`,
    );
    this.name = "SimulationConflictError";
  }
}

const simulationInputSchema = z.object({
  grupo: z.string().trim().min(1, "Informe o grupo por nome ou UUID."),
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(1900).max(9999),
  servidores: z.array(z.string()),
  seed: z.union([z.string().trim().min(1), z.number()]).optional(),
});

const DAY_BY_UTC_INDEX = diaSemanaSchema.options;

function comparisonKey(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function normalizeSimulationNames(values: readonly string[]) {
  const seen = new Set<string>();
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const key = comparisonKey(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function normalizeSimulationInput(input: SimulationInput) {
  const parsed = simulationInputSchema.parse(input);
  const servidores = normalizeSimulationNames(parsed.servidores);
  if (servidores.length < 2) {
    throw new Error("Informe pelo menos dois nomes distintos de servidores.");
  }
  return {
    ...parsed,
    servidores,
    seed:
      typeof parsed.seed === "undefined"
        ? randomBytes(12).toString("hex")
        : String(parsed.seed).trim(),
  };
}

export function resolveSimulationGroup(
  reference: string,
  groups: readonly Grupo[],
) {
  const exactId = groups.filter((group) => group.grupo_id === reference.trim());
  const normalized = comparisonKey(reference);
  const byName = groups.filter(
    (group) => comparisonKey(group.grupo_nome) === normalized,
  );
  const matches = exactId.length > 0 ? exactId : byName;
  if (matches.length === 0) throw new Error("Grupo inexistente.");
  if (matches.length > 1) throw new Error("Nome de grupo ambíguo no Sheets.");
  if (!matches[0].ativo) throw new Error("Grupo inativo não aceita simulação.");
  return matches[0];
}

export function activeSimulationSchedules(
  grupoId: string,
  schedules: readonly GrupoHorario[],
) {
  const active = schedules
    .filter((item) => item.grupo_id === grupoId && item.ativo)
    .sort(
      (first, second) =>
        diaSemanaSchema.options.indexOf(first.dia_semana) -
          diaSemanaSchema.options.indexOf(second.dia_semana) ||
        first.hora_inicio.localeCompare(second.hora_inicio),
    );
  if (active.length === 0) {
    throw new Error("O grupo não possui horários ativos.");
  }
  return active;
}

export function calculateMonthlyMeetings(
  year: number,
  month: number,
  schedules: readonly Pick<
    GrupoHorario,
    "dia_semana" | "hora_inicio" | "ativo"
  >[],
) {
  const active = schedules.filter((item) => item.ativo);
  if (active.length === 0) throw new Error("O grupo não possui horários ativos.");
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const meetings: SimulationMeeting[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const dia_semana = DAY_BY_UTC_INDEX[date.getUTCDay()];
    const data_reuniao = [
      String(year).padStart(4, "0"),
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
    for (const schedule of active) {
      if (schedule.dia_semana === dia_semana) {
        meetings.push({
          data_reuniao,
          hora_inicio: schedule.hora_inicio,
          dia_semana,
        });
      }
    }
  }
  return meetings.sort(
    (first, second) =>
      first.data_reuniao.localeCompare(second.data_reuniao) ||
      first.hora_inicio.localeCompare(second.hora_inicio),
  );
}

function xmur3(value: string) {
  let hash = 1779033703 ^ value.length;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

function seededRandom(seedValue: string) {
  const seed = xmur3(seedValue)();
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

type Random = ReturnType<typeof seededRandom>;

function integer(random: Random, minimum: number, maximum: number) {
  return Math.floor(random() * (maximum - minimum + 1)) + minimum;
}

function pick<T>(random: Random, values: readonly T[]) {
  if (values.length === 0) throw new Error("Lista de sorteio vazia.");
  return values[integer(random, 0, values.length - 1)];
}

function sampleDistinct<T>(random: Random, values: readonly T[], count: number) {
  if (count > values.length) throw new Error("Amostra maior que a lista.");
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = integer(random, 0, index);
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy.slice(0, count);
}

function buildParticipation(
  random: Random,
  totalMembers: number,
  countries: readonly string[],
) {
  const hasInternational = random() < 0.5 && countries.length > 0;
  const internationalCount = hasInternational ? 1 : 0;
  const nationalMembers = totalMembers - internationalCount;
  const targetMinimum = Math.floor(nationalMembers / 2) + 1;
  const minimumCities = Math.max(10, Math.ceil(targetMinimum / 2));
  const maximumCities = Math.min(20, nationalMembers);
  const cityCount = integer(random, minimumCities, maximumCities);
  const cities = sampleDistinct(
    random,
    municipioDocument.municipios,
    cityCount,
  );
  const presences = Array.from({ length: cityCount }, () => 1);
  let additional = targetMinimum - cityCount;
  for (const index of sampleDistinct(
    random,
    Array.from({ length: cityCount }, (_, item) => item),
    Math.max(0, additional),
  )) {
    presences[index] = 2;
    additional -= 1;
  }
  const participation = cities.map((city, index) => ({
    localidade: city.nome,
    estado: city.uf,
    pais: "Brasil",
    presencas: presences[index],
  }));
  if (hasInternational) {
    participation.push({
      localidade: "",
      estado: "",
      pais: pick(random, countries),
      presencas: 1,
    });
  }
  return participation;
}

function simulationKey(key: AtaBusinessKey) {
  return `${key.grupo_id}|${key.data_reuniao}|${key.hora_inicio}`;
}

function internationalCountryNames() {
  return countriesDocument.countries
    .map((country) => country.nome.trim())
    .filter((name) => name && comparisonKey(name) !== "brasil");
}

function generateSubmission(
  random: Random,
  groupId: string,
  meeting: SimulationMeeting,
  names: readonly string[],
  ataIndex: number,
  countries: readonly string[],
): AtaSubmission {
  const totalMembers = integer(random, 30, 60);
  const selectedServers = sampleDistinct(random, names, 2);
  const visitors = Array.from(
    { length: integer(random, 1, 2) },
    () => {
      const city = pick(random, municipioDocument.municipios);
      return {
        cidade: municipioOption(city),
        descricao: pick(random, categoriaVisitanteMapping.codes),
        como_chegou_a_na: pick(random, origemContatoMapping.codes),
      };
    },
  );
  const hasIngreso = (ataIndex + 1) % 4 === 0;
  const hasConquista = ataIndex % 3 === 0;
  const conquestIndex = Math.floor(ataIndex / 3);
  const conquestCount = hasConquista ? (conquestIndex % 2 === 0 ? 1 : 2) : 0;
  const tempos = sampleDistinct(
    random,
    tempoLimpoMapping.codes,
    conquestCount,
  );
  const submission = {
    ata: {
      grupo_id: groupId,
      data_reuniao: meeting.data_reuniao,
      hora_inicio: meeting.hora_inicio,
      duracao: "",
      formato_outros: "",
      preenchido_por: pick(random, names),
      plataforma: "zoom",
      tipo_reuniao: "fechada",
      formatos: ["partilha"],
      total_membros_presentes: totalMembers,
      total_partilhas: integer(random, 10, 17),
    },
    servidores: selectedServers.map((nome) => ({
      nome,
      funcao: pick(random, servidorFuncoesSimulacao),
    })),
    participacao: buildParticipation(random, totalMembers, countries),
    visitantes: visitors,
    ingressos: hasIngreso
      ? [
          {
            cidade: visitors[0].cidade,
          },
        ]
      : [],
    trocas_chaveiro: tempos.map((tempo_limpo) => ({
      tempo_limpo,
      quantidade: 1,
    })),
  } satisfies AtaSubmission;
  return ataSubmissionSchema.parse(submission);
}

export function validateMonthlySimulation(
  plan: Pick<
    SimulationPlan,
    "input" | "grupo" | "horarios" | "meetings" | "submissions"
  >,
) {
  const activeKeys = new Set(
    plan.horarios
      .filter((schedule) => schedule.ativo)
      .map((schedule) => `${schedule.dia_semana}|${schedule.hora_inicio}`),
  );
  const businessKeys = new Set<string>();
  let conquestPosition = 0;
  for (const [index, submission] of plan.submissions.entries()) {
    ataSubmissionSchema.parse(submission);
    const key = simulationKey(submission.ata);
    if (businessKeys.has(key)) throw new Error(`Chave mensal duplicada: ${key}`);
    businessKeys.add(key);
    if (
      !submission.ata.data_reuniao.startsWith(
        `${String(plan.input.ano).padStart(4, "0")}-${String(plan.input.mes).padStart(2, "0")}-`,
      )
    ) {
      throw new Error(`Data fora do mês solicitado: ${submission.ata.data_reuniao}`);
    }
    const meeting = plan.meetings[index];
    if (
      !meeting ||
      submission.ata.data_reuniao !== meeting.data_reuniao ||
      submission.ata.hora_inicio !== meeting.hora_inicio ||
      !activeKeys.has(`${meeting.dia_semana}|${meeting.hora_inicio}`)
    ) {
      throw new Error("Ata gerada fora dos horários ativos.");
    }
    if (submission.servidores.length !== 2) {
      throw new Error("Cada ata deve conter exatamente dois servidores.");
    }
    if (
      comparisonKey(submission.servidores[0].nome) ===
      comparisonKey(submission.servidores[1].nome)
    ) {
      throw new Error("Servidores repetidos na mesma ata.");
    }
    const nationalLocations = submission.participacao.filter(
      (item) => item.pais === "Brasil",
    );
    if (
      nationalLocations.length < 10 ||
      nationalLocations.length > 20 ||
      nationalLocations.some(
        (item) =>
          !isMunicipioOption(`${item.localidade} - ${item.estado}`) ||
          item.presencas < 1 ||
          item.presencas > 2,
      ) ||
      new Set(
        nationalLocations.map(
          (item) => `${item.localidade}|${item.estado}`.toLocaleLowerCase("pt-BR"),
        ),
      ).size !== nationalLocations.length
    ) {
      throw new Error("Localidades inválidas ou repetidas.");
    }
    const international = submission.participacao.filter(
      (item) => item.pais !== "Brasil",
    );
    if (
      international.length > 1 ||
      international.some(
        (item) =>
          item.localidade !== "" ||
          item.estado !== "" ||
          item.presencas !== 1 ||
          comparisonKey(item.pais) === "brasil",
      )
    ) {
      throw new Error("Participação internacional inválida.");
    }
    const nationalMembers =
      submission.ata.total_membros_presentes -
      international.reduce((total, item) => total + item.presencas, 0);
    const informedNational = nationalLocations.reduce(
      (total, item) => total + item.presencas,
      0,
    );
    if (informedNational < Math.floor(nationalMembers / 2) + 1) {
      throw new Error("As localidades não representam maioria nacional.");
    }
    const expectedIngreso = (index + 1) % 4 === 0;
    if (submission.ingressos.length !== (expectedIngreso ? 1 : 0)) {
      throw new Error("Sequência mensal de ingressos inválida.");
    }
    const expectedConquest = index % 3 === 0;
    const expectedCount = expectedConquest
      ? conquestPosition % 2 === 0
        ? 1
        : 2
      : 0;
    if (submission.trocas_chaveiro.length !== expectedCount) {
      throw new Error("Sequência mensal de conquistas inválida.");
    }
    if (expectedConquest) conquestPosition += 1;
  }
  if (plan.meetings.length !== plan.submissions.length) {
    throw new Error("Quantidade de reuniões e atas diverge.");
  }
  return true;
}

export function createMonthlySimulationPlan(
  input: SimulationInput,
  groups: readonly Grupo[],
  schedules: readonly GrupoHorario[],
  existingKeys: readonly AtaBusinessKey[],
  countries: readonly string[] = internationalCountryNames(),
): SimulationPlan {
  const normalized = normalizeSimulationInput(input);
  const group = resolveSimulationGroup(normalized.grupo, groups);
  const activeSchedules = activeSimulationSchedules(
    group.grupo_id,
    schedules,
  );
  const meetings = calculateMonthlyMeetings(
    normalized.ano,
    normalized.mes,
    activeSchedules,
  );
  const existing = new Set(existingKeys.map(simulationKey));
  const conflicts = meetings
    .map((meeting) => ({
      grupo_id: group.grupo_id,
      data_reuniao: meeting.data_reuniao,
      hora_inicio: meeting.hora_inicio,
    }))
    .filter((key) => existing.has(simulationKey(key)));
  if (conflicts.length > 0) throw new SimulationConflictError(conflicts);
  const canonicalSeed = [
    group.grupo_id,
    normalized.ano,
    normalized.mes,
    normalized.servidores.map(comparisonKey).join("|"),
    normalized.seed,
  ].join("::");
  const random = seededRandom(canonicalSeed);
  const submissions = meetings.map((meeting, index) =>
    generateSubmission(
      random,
      group.grupo_id,
      meeting,
      normalized.servidores,
      index,
      countries.filter((country) => comparisonKey(country) !== "brasil"),
    ),
  );
  const plan: SimulationPlan = {
    input: normalized,
    grupo: {
      grupo_id: group.grupo_id,
      grupo_nome: group.grupo_nome,
      ativo: group.ativo,
    },
    horarios: activeSchedules.map(
      ({ horario_id, dia_semana, hora_inicio, ativo }) => ({
        horario_id,
        dia_semana,
        hora_inicio,
        ativo,
      }),
    ),
    meetings,
    submissions,
    conflicts: [],
    validations: [
      "entrada",
      "grupo-ativo",
      "horarios-ativos",
      "calendario-real",
      "duplicidade",
      "schemas-atuais",
      "conjunto-mensal",
    ],
  };
  validateMonthlySimulation(plan);
  return plan;
}
