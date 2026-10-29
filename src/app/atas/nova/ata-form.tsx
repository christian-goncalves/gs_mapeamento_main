"use client";

import { useActionState, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardCheck,
  faPaperPlane,
  faPenToSquare,
  faPlus,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import type { HiddenAtaSubmission } from "@/domain/hidden-submission";
import type { FusoHorario, Plataforma } from "@/domain/enums";
import type { Pais } from "@/domain/paises";
import {
  categoriaVisitanteMapping,
  formatoMapping,
  origemContatoMapping,
  plataformaMapping,
  servidorFuncoes,
  tempoLimpoMapping,
  tipoReuniaoMapping,
} from "@/domain/enums";
import { checkAtaAvailabilityAction, createAtaAction, type CreateAtaState } from "./actions";
import { AtaReviewLayout, type AtaReviewLayoutData } from "../ata-review-layout";
import { MunicipioAutocomplete } from "./municipio-autocomplete";
import { TextAutocomplete } from "./text-autocomplete";
import { convertLocalMeetingToBrasilia } from "@/domain/time-zones";
import { ataPlatformErrorMessage, findRecurringAtaSchedules, getAtaPlatformPreflightError } from "@/domain/ata-platform";
import type { GrupoHorario } from "@/domain/schemas";
import {
  normalizeServerFunctionName,
  SERVER_FUNCTION_MAX_LENGTH,
  serverFunctionComparisonKey,
} from "@/domain/server-functions";

type ClientRow = { clientId: string };
type VisitorSubmission = HiddenAtaSubmission["visitantes"][number];
type VisitorDraft = Omit<
  VisitorSubmission,
  "descricao" | "como_chegou_a_na"
> & {
  descricao: VisitorSubmission["descricao"] | "";
  como_chegou_a_na: VisitorSubmission["como_chegou_a_na"] | "";
};
type Draft = Omit<
  HiddenAtaSubmission,
  "servidores" | "participacao" | "membros_internacionais" | "visitantes" | "ingressos" | "trocas_chaveiro"
> & {
  servidores: (HiddenAtaSubmission["servidores"][number] & ClientRow)[];
  participacao: (HiddenAtaSubmission["participacao"][number] & ClientRow)[];
  membros_internacionais: (HiddenAtaSubmission["membros_internacionais"][number] & ClientRow)[];
  visitantes: (VisitorDraft & ClientRow)[];
  ingressos: (HiddenAtaSubmission["ingressos"][number] & ClientRow)[];
  trocas_chaveiro: (HiddenAtaSubmission["trocas_chaveiro"][number] & ClientRow)[];
};

const initialActionState: CreateAtaState = {};
const horarios = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  return `${String(hours).padStart(2, "0")}:${index % 2 === 0 ? "00" : "30"}`;
});
const tipoReuniaoOptions: Draft["ata"]["tipo_reuniao"][] = [
  "fechada",
  "aberta",
];
const weekdayCodes = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

type AtaFormGroup = {
  id: string;
  name: string;
  plataforma: Plataforma;
  fuso_horario?: FusoHorario;
  plataformas?: Plataforma[];
  funcoesServidor?: string[];
  horarios?: { dia_semana: GrupoHorario["dia_semana"]; hora_inicio: string; link_reuniao: string; plataformaTipo?: Plataforma }[];
};

function nextRecurringOccurrence(group: AtaFormGroup | undefined, today: string) {
  if (!group) return { date: today, time: "20:00" };
  const matches = (group.horarios ?? []).flatMap((schedule) => {
    for (let shift = -1; shift <= 8; shift += 1) {
      const candidate = new Date(`${today}T00:00:00.000Z`);
      candidate.setUTCDate(candidate.getUTCDate() + shift);
      const sourceDate = candidate.toISOString().slice(0, 10);
      if (weekdayCodes[new Date(`${sourceDate}T00:00:00.000Z`).getUTCDay()] !== schedule.dia_semana) continue;
      const converted = convertLocalMeetingToBrasilia(sourceDate, schedule.hora_inicio, group.fuso_horario ?? "America/Sao_Paulo");
      if (converted.data >= today) return [{ date: converted.data, time: converted.horario }];
    }
    return [];
  });
  return matches.sort((first, second) => `${first.date}|${first.time}`.localeCompare(`${second.date}|${second.time}`))[0] ?? { date: today, time: "20:00" };
}
const servidorFuncaoOptions = servidorFuncoes;
const personalizeFunctionOption = "__personalizar__";

function addRowOnEnter(event: KeyboardEvent<HTMLDivElement>, addRow: () => void) {
  if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  if (target instanceof HTMLInputElement && target.type === "checkbox") return;
  event.preventDefault();
  addRow();
}

type AtaNameSuggestions = {
  servidores: string[];
};

function clientId() {
  return globalThis.crypto.randomUUID();
}

function cidadeEstado(value: string) {
  const match = value.match(/^(.*)\s+-\s+([A-Z]{2})$/);
  if (!match) return { cidade: value, estado: "-" };
  return { cidade: match[1], estado: match[2] };
}

function NumberStepper({
  id,
  label,
  showLabel = true,
  value,
  min = 1,
  max,
  onChange,
}: {
  id: string;
  label: string;
  showLabel?: boolean;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  const canDecrease = value > min;
  const canIncrease = typeof max === "number" ? value < max : true;

  function update(nextValue: number) {
    if (Number.isNaN(nextValue)) {
      onChange(0);
      return;
    }
    if (typeof max === "number" && nextValue > max) {
      onChange(max);
      return;
    }
    onChange(nextValue);
  }

  return (
    <label htmlFor={id}>
      {showLabel && <span>{label}</span>}
      <span className="number-stepper">
        <button
          type="button"
          className="icon-button"
          aria-label={`Diminuir ${label.toLowerCase()}`}
          disabled={!canDecrease}
          onClick={() => update(value - 1)}
        >
          -
        </button>
        <input
          id={id}
          aria-label={showLabel ? undefined : label}
          type="number"
          required
          min={min}
          max={max}
          step={1}
          value={value || ""}
          placeholder="0"
          onChange={(event) => update(Number(event.target.value))}
        />
        <button
          type="button"
          className="icon-button"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          disabled={!canIncrease}
          onClick={() => update(value < min ? min : value + 1)}
        >
          +
        </button>
      </span>
    </label>
  );
}

function submissionFromDraft(draft: Draft) {
  return {
    ata: draft.ata,
    servidores: draft.servidores.map(({ nome, funcao }) => ({ nome, funcao })),
    participacao: draft.participacao.map(
      ({ localidade, presencas }) => ({
        localidade,
        presencas,
      }),
    ),
    membros_internacionais: draft.membros_internacionais.map(
      ({ pais, presencas }) => ({ pais, presencas }),
    ),
    visitantes: draft.visitantes.map(
      ({ cidade, descricao, como_chegou_a_na }) => ({
        cidade,
        descricao,
        como_chegou_a_na,
      }),
    ),
    ingressos: draft.ingressos.map((item, index) => ({
      cidade: draft.visitantes[index]?.cidade ?? item.cidade,
    })),
    trocas_chaveiro: draft.trocas_chaveiro.map(({ tempo_limpo, quantidade }) => ({
      tempo_limpo,
      quantidade,
    })),
  };
}

function draftFromSubmission(submission: HiddenAtaSubmission): Draft {
  return {
    ata: submission.ata,
    servidores: submission.servidores.map((item) => ({ ...item, clientId: clientId() })),
    participacao: submission.participacao.map((item) => ({ ...item, clientId: clientId() })),
    membros_internacionais: submission.membros_internacionais.map((item) => ({ ...item, clientId: clientId() })),
    visitantes: submission.visitantes.map((item) => ({
      ...item,
      clientId: clientId(),
    })),
    ingressos: submission.ingressos
      .slice(0, submission.visitantes.length)
      .map((item) => ({ ...item, clientId: clientId() })),
    trocas_chaveiro: submission.trocas_chaveiro.map((item) => ({ ...item, clientId: clientId() })),
  };
}

export function AtaForm({
  groups,
  today,
  action = createAtaAction,
  fixedGroupId,
  linkFormularioAta,
  initialSubmission,
  revision,
}: {
  groups: {
    id: string;
    name: string;
    plataforma: Plataforma;
    fuso_horario?: FusoHorario;
    plataformas?: Plataforma[];
    funcoesServidor?: string[];
    horarios?: { dia_semana: GrupoHorario["dia_semana"]; hora_inicio: string; link_reuniao: string; plataformaTipo?: Plataforma }[];
  }[];
  today: string;
  action?: (previousState: { error?: string }, formData: FormData) => Promise<{ error?: string }>;
  fixedGroupId?: string;
  linkFormularioAta?: string;
  initialSubmission?: HiddenAtaSubmission;
  revision?: {
    ataId: string;
    updatedAt: string;
    approvalStatus: "aprovada" | "pendente_revisao";
  };
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [reviewing, setReviewing] = useState(false);
  const [clientError, setClientError] = useState<string>();
  const [groupFunctions, setGroupFunctions] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(groups.map((group) => [group.id, group.funcoesServidor ?? []])),
  );
  const [functionModal, setFunctionModal] = useState<{ serverId: string; previousValue: string }>();
  const [functionModalValue, setFunctionModalValue] = useState("");
  const [functionModalError, setFunctionModalError] = useState<string>();
  const [nameSuggestions, setNameSuggestions] = useState<AtaNameSuggestions>({
    servidores: [],
  });
  const [paises, setPaises] = useState<Pais[]>([]);
  const [actionState, formAction, pending] = useActionState(
    action,
    initialActionState,
  );
  const initialGroupId = fixedGroupId ?? groups[0].id;
  const initialGroup = groups.find((group) => group.id === initialGroupId);
  const initialOccurrence = nextRecurringOccurrence(initialGroup as AtaFormGroup | undefined, today);
  const [draft, setDraft] = useState<Draft>(() => initialSubmission
    ? draftFromSubmission(initialSubmission)
    : {
        ata: {
          grupo_id: initialGroupId,
          data_reuniao: initialOccurrence.date,
          hora_inicio: initialOccurrence.time,
          duracao: "",
          formato_outros: "",
          preenchido_por: "",
          plataforma: initialGroup?.plataforma ?? "zoom",
          tipo_reuniao: "fechada",
          formatos: [],
          total_membros_presentes: 0,
          total_partilhas: 0,
        },
        servidores: [],
        participacao: [],
        membros_internacionais: [],
        visitantes: [],
        ingressos: [],
        trocas_chaveiro: [],
      });
  const [revisionReason, setRevisionReason] = useState("");
  const [availability, setAvailability] = useState<
    | { status: "checking"; key: string }
    | { status: "ready"; key: string; occupiedTimes: string[] }
    | { status: "error"; key: string; message: string }
  >({ status: "checking", key: "" });
  const selectedGroup = groups.find((group) => group.id === draft.ata.grupo_id);
  const availabilityKey = `${draft.ata.grupo_id}|${draft.ata.data_reuniao}|${revision?.ataId ?? ""}`;
  const availabilityReady = availability.status === "ready" && availability.key === availabilityKey;
  const availabilityChecking = availability.status === "checking" || availability.key !== availabilityKey;
  const availabilityError = availability.status === "error" && availability.key === availabilityKey
    ? availability.message
    : undefined;
  const groupSchedules = (selectedGroup?.horarios ?? []).map((schedule) => ({
    grupo_id: selectedGroup?.id ?? "",
    ativo: true,
    dia_semana: schedule.dia_semana,
    hora_inicio: schedule.hora_inicio,
  }));
  const matchingRecurringSchedules = selectedGroup ? findRecurringAtaSchedules({
    groupId: selectedGroup.id,
    timeZone: selectedGroup.fuso_horario ?? "America/Sao_Paulo",
    date: draft.ata.data_reuniao,
    time: draft.ata.hora_inicio,
    schedules: groupSchedules,
  }) : [];
  const recurringScheduleForAta = matchingRecurringSchedules.length === 1 ? selectedGroup?.horarios?.find((schedule) =>
    schedule.dia_semana === matchingRecurringSchedules[0].dia_semana && schedule.hora_inicio === matchingRecurringSchedules[0].hora_inicio
  ) : undefined;
  const recurringPlatformType = recurringScheduleForAta?.plataformaTipo;
  const availablePlatformTypes = selectedGroup?.plataformas ?? [];
  const platformPreflightError = getAtaPlatformPreflightError({
    matchingScheduleCount: matchingRecurringSchedules.length,
    recurringPlatformType,
    explicitPlatformConfirmed: false,
    activePlatformTypes: availablePlatformTypes,
    selectedPlatform: draft.ata.plataforma,
  });
  const submission = submissionFromDraft({ ...draft, ata: { ...draft.ata, plataforma: recurringPlatformType ?? draft.ata.plataforma } });
  const paisSuggestions = paises
    .map((pais) => pais.nome)
    .filter((pais) => pais.localeCompare("Brasil", "pt-BR", { sensitivity: "accent" }) !== 0);
  const hasBrazilAsInternational = draft.membros_internacionais.some((item) =>
    item.pais.trim().localeCompare("Brasil", "pt-BR", { sensitivity: "accent" }) === 0,
  );
  const reviewConquistasTempo = draft.trocas_chaveiro.flatMap((item) =>
    Array.from({ length: item.quantidade }, (_, index) => ({
      id: `${item.clientId}-${index}`,
      tempo: tempoLimpoMapping.toSheet(item.tempo_limpo),
    })),
  );
  const reviewLayoutData: AtaReviewLayoutData = {
    group: selectedGroup?.name ?? "Não informado",
    date: draft.ata.data_reuniao,
    time: draft.ata.hora_inicio,
    filledBy: draft.ata.preenchido_por,
    platform: plataformaMapping.toSheet(recurringPlatformType ?? draft.ata.plataforma),
    meetingType: tipoReuniaoMapping.toSheet(draft.ata.tipo_reuniao),
    formats: draft.ata.formatos.map((code) => formatoMapping.toSheet(code)).join(", "),
    membersPresent: draft.ata.total_membros_presentes,
    shares: draft.ata.total_partilhas,
    additionalInformation: revision && revisionReason.trim()
      ? [{ label: "Motivo da Alteração", value: revisionReason.trim() }]
      : undefined,
    servers: draft.servidores.map((item) => ({
      id: item.clientId,
      name: item.nome,
      role: item.funcao,
    })),
    locations: draft.participacao.map((item) => ({
      id: item.clientId,
      name: item.localidade,
      count: item.presencas,
    })),
    internationalMembers: draft.membros_internacionais.map((item) => ({
      id: item.clientId,
      country: item.pais,
      count: item.presencas,
    })),
    visitors: draft.visitantes.map((item) => ({
      id: item.clientId,
      label: "Visitante",
      city: item.cidade,
      category: item.descricao
        ? categoriaVisitanteMapping.toSheet(item.descricao)
        : "Não informado",
      origin: item.como_chegou_a_na
        ? origemContatoMapping.toSheet(item.como_chegou_a_na)
        : "Não informada",
    })),
    admissions: draft.ingressos.map((item, index) => {
      const location = cidadeEstado(draft.visitantes[index]?.cidade ?? item.cidade);
      return {
        id: item.clientId,
        label: "Ingresso",
        city: location.cidade,
        state: location.estado,
      };
    }),
    achievements: reviewConquistasTempo.map((item) => ({
      id: item.id,
      label: "Conquista",
      time: item.tempo,
    })),
    supplementalMetrics: {
      cities: new Set(draft.participacao.map((item) => item.localidade.trim().toLocaleLowerCase("pt-BR")).filter(Boolean)).size,
      states: new Set(draft.participacao.map((item) => cidadeEstado(item.localidade).estado).filter((state) => state !== "-")).size,
      otherCountries: new Set(draft.membros_internacionais.map((item) => item.pais.trim().toLocaleLowerCase("pt-BR")).filter((country) => country && country !== "brasil")).size,
    },
  };
  const scheduledTimesForDate = selectedGroup
    ? horarios.filter((time) => findRecurringAtaSchedules({
        groupId: selectedGroup.id,
        timeZone: selectedGroup.fuso_horario ?? "America/Sao_Paulo",
        date: draft.ata.data_reuniao,
        time,
        schedules: groupSchedules,
      }).length > 0)
    : [];
  const occupiedTimes = availability.status === "ready" && availability.key === availabilityKey
    ? availability.occupiedTimes
    : [];
  const horarioOptions = availabilityReady
    ? scheduledTimesForDate.filter((time) => !occupiedTimes.includes(time))
    : [];
  const noScheduledTimes = availabilityReady && scheduledTimesForDate.length === 0;
  const noAvailableTimes = availabilityReady && scheduledTimesForDate.length > 0 && horarioOptions.length === 0;
  const selectedHorario = horarioOptions.includes(draft.ata.hora_inicio)
    ? draft.ata.hora_inicio
    : horarioOptions[0] ?? "";
  const displayedPlatformType = recurringPlatformType ?? (
    availablePlatformTypes.length === 1 ? availablePlatformTypes[0] : undefined
  );

  useEffect(() => {
    const controller = new AbortController();
    async function loadPaises() {
      try {
        const response = await fetch("/api/paises", { signal: controller.signal });
        if (!response.ok) throw new Error("Países indisponíveis.");
        const data = (await response.json()) as { countries?: Pais[] };
        setPaises(data.countries ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setPaises([]);
        }
      }
    }
    void loadPaises();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const grupoId = draft.ata.grupo_id;
    const controller = new AbortController();
    async function loadSuggestions() {
      try {
        const response = await fetch(
          `/api/ata-name-suggestions?grupo_id=${encodeURIComponent(grupoId)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Sugestões indisponíveis.");
        const data = (await response.json()) as {
          suggestions?: Partial<AtaNameSuggestions>;
        };
        setNameSuggestions({
          servidores: data.suggestions?.servidores ?? [],
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setNameSuggestions({ servidores: [] });
        }
      }
    }
    void loadSuggestions();
    return () => controller.abort();
  }, [draft.ata.grupo_id]);

  useEffect(() => {
    let current = true;
    setAvailability({ status: "checking", key: availabilityKey });
    const timer = window.setTimeout(() => {
      void checkAtaAvailabilityAction({
        grupo_id: draft.ata.grupo_id,
        data_reuniao: draft.ata.data_reuniao,
        link_formulario_ata: linkFormularioAta,
        ignorar_ata_id: revision?.ataId,
      }).then((result) => {
        if (!current) return;
        if ("error" in result) {
          setAvailability({ status: "error", key: availabilityKey, message: result.error ?? "Não foi possível verificar a disponibilidade agora. Tente novamente." });
        } else {
          setAvailability({ status: "ready", key: availabilityKey, occupiedTimes: result.occupiedTimes });
        }
      }).catch(() => {
        if (current) setAvailability({ status: "error", key: availabilityKey, message: "Não foi possível verificar a disponibilidade agora. Tente novamente." });
      });
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [availabilityKey, draft.ata.grupo_id, draft.ata.data_reuniao, linkFormularioAta, revision?.ataId]);

  useEffect(() => {
    if (!availabilityReady) return;
    setDraft((current) => current.ata.hora_inicio === selectedHorario
      ? current
      : { ...current, ata: { ...current.ata, hora_inicio: selectedHorario } },
    );
  }, [availabilityReady, selectedHorario]);

  function removeVisitante(clientIdToRemove: string) {
    setDraft((current) => ({
      ...current,
      visitantes: current.visitantes.filter(
        (item) => item.clientId !== clientIdToRemove,
      ),
      ingressos: current.ingressos.slice(0, Math.max(0, current.visitantes.length - 1)),
    }));
  }

  function focusAddedField(id: string) {
    window.requestAnimationFrame(() => document.getElementById(id)?.focus());
  }

  function addServer() {
    const id = clientId();
    setDraft((current) => ({
      ...current,
      servidores: [...current.servidores, { clientId: id, nome: "", funcao: "" }],
    }));
    focusAddedField(`server-name-${id}`);
  }

  function openFunctionModal(serverId: string, previousValue: string) {
    setFunctionModal({ serverId, previousValue });
    setFunctionModalValue("");
    setFunctionModalError(undefined);
  }

  function closeFunctionModal() {
    setFunctionModal(undefined);
    setFunctionModalValue("");
    setFunctionModalError(undefined);
  }

  function confirmFunctionModal() {
    if (!functionModal) return;
    const rawValue = functionModalValue.trim();
    if (!rawValue) {
      setFunctionModalError("Informe o nome da função.");
      return;
    }
    if (rawValue.length > SERVER_FUNCTION_MAX_LENGTH) {
      setFunctionModalError(`O nome deve ter no máximo ${SERVER_FUNCTION_MAX_LENGTH} caracteres.`);
      return;
    }
    const normalized = normalizeServerFunctionName(rawValue);
    const fixedFunction = servidorFuncaoOptions.find(
      (option) => serverFunctionComparisonKey(option) === serverFunctionComparisonKey(normalized),
    );
    const currentGroupFunctions = groupFunctions[draft.ata.grupo_id] ?? [];
    const existingFunction = currentGroupFunctions.find(
      (option) => serverFunctionComparisonKey(option) === serverFunctionComparisonKey(normalized),
    );
    const selectedFunction = fixedFunction ?? existingFunction ?? normalized;
    if (!fixedFunction && !existingFunction) {
      setGroupFunctions((current) => ({
        ...current,
        [draft.ata.grupo_id]: [...(current[draft.ata.grupo_id] ?? []), normalized],
      }));
    }
    setDraft((current) => ({
      ...current,
      servidores: current.servidores.map((server) =>
        server.clientId === functionModal.serverId
          ? { ...server, funcao: selectedFunction }
          : server,
      ),
    }));
    closeFunctionModal();
  }

  function addNationalLocation() {
    const id = clientId();
    setDraft((current) => ({
      ...current,
      participacao: [...current.participacao, { clientId: id, localidade: "", presencas: 1 }],
    }));
    focusAddedField(`participation-city-${id}`);
  }

  function addInternationalLocation() {
    const id = clientId();
    setDraft((current) => ({
      ...current,
      membros_internacionais: [...current.membros_internacionais, { clientId: id, pais: "", presencas: 1 }],
    }));
    focusAddedField(`international-country-${id}`);
  }

  function addVisitor() {
    const id = clientId();
    setDraft((current) => ({
      ...current,
      visitantes: [...current.visitantes, { clientId: id, cidade: "", descricao: "", como_chegou_a_na: "" }],
    }));
    focusAddedField(`city-${id}`);
  }

  function updateIngressoCount(value: number) {
    setDraft((current) => {
      const count = Number.isFinite(value)
        ? Math.max(0, Math.min(Math.trunc(value), current.visitantes.length))
        : 0;
      return {
        ...current,
        ingressos: Array.from({ length: count }, (_, index) => ({
          clientId: current.ingressos[index]?.clientId ?? clientId(),
          cidade: current.visitantes[index]?.cidade ?? current.ingressos[index]?.cidade ?? "",
        })),
      };
    });
  }

  function addAchievement() {
    const id = clientId();
    setDraft((current) => ({
      ...current,
      trocas_chaveiro: [...current.trocas_chaveiro, { clientId: id, tempo_limpo: "dias_30", quantidade: 1 }],
    }));
    focusAddedField(`clean-time-${id}`);
  }

  function review() {
    setClientError(undefined);
    if (platformPreflightError) {
      setClientError(ataPlatformErrorMessage(platformPreflightError));
      return;
    }
    if (!availabilityReady) {
      setClientError(availabilityError ?? "Aguarde a verificação da disponibilidade de horário.");
      return;
    }
    if (hasBrazilAsInternational) {
      setClientError("Brasil deve ser cadastrado em Localidades nacionais.");
      return;
    }
    if (!formRef.current?.reportValidity()) return;
    if (draft.ata.formatos.length === 0) {
      setClientError("Selecione pelo menos um formato de reunião.");
      return;
    }
    const presencas = [
      ...draft.participacao,
      ...draft.membros_internacionais,
    ].reduce((total, item) => total + item.presencas, 0);
    if (presencas > draft.ata.total_membros_presentes) {
      setClientError("A soma das presenças por localidade supera o total de membros presentes.");
      return;
    }
    if (draft.ingressos.length > draft.visitantes.length) {
      setClientError("A quantidade de ingressos não pode ser maior que a quantidade de visitantes.");
      return;
    }
    setReviewing(true);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="creation-form"
      onSubmit={(event) => {
        if (!reviewing) event.preventDefault();
      }}
    >
      <input type="hidden" name="confirmed" value={reviewing ? "true" : "false"} />
      <input type="hidden" name="payload" value={JSON.stringify(submission)} />
      {revision && (
        <>
          <input type="hidden" name="ata_id" value={revision.ataId} />
          <input type="hidden" name="updated_at" value={revision.updatedAt} />
        </>
      )}
      {linkFormularioAta && (
        <input type="hidden" name="link_formulario_ata" value={linkFormularioAta} />
      )}

      <section className="card form-section">
        <h2>Informações Gerais</h2>
        <div className="form-grid ata-general-info-grid">
          {!fixedGroupId && (
            <label className="ata-group-field">
              Grupo
              <select
                required
                value={draft.ata.grupo_id}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    ata: {
                      ...current.ata,
                      grupo_id: event.target.value,
                      plataforma: groups.find((group) => group.id === event.target.value)?.plataformas?.[0] ?? current.ata.plataforma,
                      hora_inicio:
                        groups.find((group) => group.id === event.target.value)
                          ?.horarios?.[0]?.hora_inicio ?? current.ata.hora_inicio,
                    },
                  }));
                }}
              >
                {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            </label>
          )}
          <label className="ata-date-field">
            Data
            <input
              className="ata-date-input"
              type="date"
              required
              value={draft.ata.data_reuniao}
              onChange={(event) => { setDraft((current) => ({
                ...current,
                ata: { ...current.ata, data_reuniao: event.target.value },
              })); }}
            />
          </label>
          <label>
            Horário
            <select
              required
              disabled={!availabilityReady || horarioOptions.length === 0}
              value={selectedHorario}
              onChange={(event) => { setDraft((current) => ({
                ...current,
                ata: { ...current.ata, hora_inicio: event.target.value },
              })); }}
            >
              <option value="">Selecione...</option>
              {horarioOptions.map((time) => <option key={time} value={time}>{time}</option>)}
            </select>
          </label>
        </div>
        {availabilityChecking ? (
          <p className="muted" role="status">Verificando disponibilidade de horário…</p>
        ) : availabilityError ? (
          <p className="form-error" role="alert">{availabilityError}</p>
        ) : noScheduledTimes ? (
          <p className="form-error" role="alert">Não há horários cadastrados na agenda para esta data. Escolha outra data.</p>
        ) : noAvailableTimes ? (
          <p className="form-error" role="alert">Todos os horários da agenda para esta data já estão preenchidos. Escolha outra data.</p>
        ) : null}
        {availabilityReady && horarioOptions.length > 0 && (
          <>
        {platformPreflightError && <p className="form-error" role="alert">{ataPlatformErrorMessage(platformPreflightError)}</p>}

        <div className="ata-type-platform-grid">
          <fieldset>
            <legend>Tipo de Reunião</legend>
            <div className="choice-row">
              {tipoReuniaoOptions.map((code) => (
                <label key={code} className="choice">
                  <input
                    type="radio"
                    checked={draft.ata.tipo_reuniao === code}
                    onChange={() => setDraft((current) => ({
                      ...current,
                      ata: { ...current.ata, tipo_reuniao: code },
                    }))}
                  />
                  {tipoReuniaoMapping.toSheet(code)}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="ata-platform-card" aria-live="polite">
            <legend>Plataforma</legend>
            {displayedPlatformType ? (
              <span className={`platform-legend-badge platform-legend-badge--${displayedPlatformType}`}>
                <span className={`platform-color-dot platform-color-dot--${displayedPlatformType}`} aria-hidden="true" />
                {plataformaMapping.toSheet(displayedPlatformType)}
              </span>
            ) : (
              <span className="muted">Não configurada para este horário</span>
            )}
          </fieldset>
        </div>

        <fieldset>
          <legend>Formatos</legend>
          <div className="choice-row">
            {formatoMapping.codes.map((code) => (
              <label key={code} className="choice">
                <input
                  type="checkbox"
                  checked={draft.ata.formatos.includes(code)}
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    ata: {
                      ...current.ata,
                      formatos: event.target.checked
                        ? [...current.ata.formatos, code]
                        : current.ata.formatos.filter((item) => item !== code),
                    },
                  }))}
                />
                {formatoMapping.toSheet(code)}
              </label>
            ))}
          </div>
          {draft.ata.formatos.includes("outros") && (
            <label className="narrow-field">
              Descreva o formato
              <input
                required
                value={draft.ata.formato_outros}
                placeholder="Formato da reunião..."
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  ata: { ...current.ata, formato_outros: event.target.value },
                }))}
              />
            </label>
          )}
        </fieldset>
          </>
        )}
      </section>

      {availabilityReady && horarioOptions.length > 0 && (
        <>
      <section className="card form-section">
        <div className="section-heading">
          <h2>Servidores</h2>
        </div>
        {draft.servidores.map((item, index) => {
          const customFunctions = groupFunctions[draft.ata.grupo_id] ?? [];
          const functionOptions = [...new Set([
            ...servidorFuncaoOptions,
            ...customFunctions,
            ...(item.funcao && item.funcao !== personalizeFunctionOption ? [item.funcao] : []),
          ])];
          return (
          <div className="repeat-row repeat-row--double repeat-row--server repeat-row--unseparated" key={item.clientId} onKeyDown={(event) => addRowOnEnter(event, addServer)}>
            <label>{index === 0 && <span>Nome</span>}<TextAutocomplete id={`server-name-${item.clientId}`} ariaLabel={index === 0 ? undefined : "Nome do Servidor"} required value={item.nome} placeholder="Nome..." suggestions={nameSuggestions.servidores} onChange={(value) => setDraft((current) => ({
              ...current,
              servidores: current.servidores.map((server) => server.clientId === item.clientId ? { ...server, nome: value } : server),
            }))} /></label>
            <label>{index === 0 && <span>Função</span>}<select aria-label={index === 0 ? undefined : "Função do Servidor"} value={item.funcao ?? ""} onChange={(event) => {
              if (event.target.value === personalizeFunctionOption) {
                openFunctionModal(item.clientId, item.funcao ?? "");
                return;
              }
              setDraft((current) => ({
                ...current,
                servidores: current.servidores.map((server) => server.clientId === item.clientId ? { ...server, funcao: event.target.value } : server),
              }));
            }}>
              <option value="">Selecione...</option>
              {functionOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
              <option value={personalizeFunctionOption}>Personalizar</option>
            </select></label>
            <button type="button" className="danger-icon-button" aria-label="Remover servidor" title="Remover servidor" onClick={() => setDraft((current) => ({ ...current, servidores: current.servidores.filter((server) => server.clientId !== item.clientId) }))}><FontAwesomeIcon icon={faTrashCan} /></button>
          </div>
          );
        })}
        <div className="section-footer">
          <button
            type="button"
            className="secondary"
            onClick={addServer}
          ><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar</span></button>
        </div>
      </section>

      {functionModal && (
        <div className="modal-backdrop server-function-modal-backdrop">
          <section className="confirmation-modal server-function-modal" role="dialog" aria-modal="true" aria-labelledby="server-function-modal-title">
            <h2 id="server-function-modal-title">Personalizar</h2>
            <label>
              <span>Nome</span>
              <input
                autoFocus
                maxLength={SERVER_FUNCTION_MAX_LENGTH}
                value={functionModalValue}
                onChange={(event) => {
                  setFunctionModalValue(event.target.value);
                  setFunctionModalError(undefined);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    confirmFunctionModal();
                  }
                }}
              />
            </label>
            {functionModalError && <p className="form-error" role="alert">{functionModalError}</p>}
            <div className="modal-actions">
              <button type="button" onClick={confirmFunctionModal}>Confirmar</button>
              <button type="button" className="secondary" onClick={closeFunctionModal}>Cancelar</button>
            </div>
          </section>
        </div>
      )}

      <section className="card form-section">
        <div className="section-heading">
          <h2>Participação</h2>
        </div>
        <div className="form-grid ata-participation-grid">
          <NumberStepper
            id="total-membros-presentes"
            label="Membros"
            value={draft.ata.total_membros_presentes}
            min={1}
            max={100}
            onChange={(value) => setDraft((current) => ({
              ...current,
              ata: {
                ...current.ata,
                total_membros_presentes: value,
                total_partilhas: Math.min(current.ata.total_partilhas, value),
              },
            }))}
          />
          <NumberStepper
            id="total-partilhas"
            label="Partilhas"
            value={draft.ata.total_partilhas}
            min={1}
            max={Math.min(30, draft.ata.total_membros_presentes)}
            onChange={(value) => setDraft((current) => ({
              ...current,
              ata: { ...current.ata, total_partilhas: value },
            }))}
          />
        </div>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Localidades Nacionais</h2>
        </div>
        {draft.participacao.map((item, index) => (
          <div className="repeat-row repeat-row--city repeat-row--locality repeat-row--compact-quantity repeat-row--unseparated" key={item.clientId} onKeyDown={(event) => addRowOnEnter(event, addNationalLocation)}>
            <label htmlFor={`participation-city-${item.clientId}`}>{index === 0 && <span>Cidade</span>}<MunicipioAutocomplete ariaLabel={index === 0 ? undefined : "Cidade"} id={`participation-city-${item.clientId}`} placeholder="Cidade..." value={item.localidade} onChange={(value) => setDraft((current) => ({ ...current, participacao: current.participacao.map((entry) => entry.clientId === item.clientId ? { ...entry, localidade: value } : entry) }))} /></label>
            <NumberStepper
              id={`participation-count-${item.clientId}`}
              label="Quantidade"
              showLabel={index === 0}
              value={item.presencas}
              min={1}
              max={10}
              onChange={(value) => setDraft((current) => ({ ...current, participacao: current.participacao.map((entry) => entry.clientId === item.clientId ? { ...entry, presencas: value } : entry) }))}
            />
            <button type="button" className="danger-icon-button" aria-label="Remover cidade" title="Remover cidade" onClick={() => setDraft((current) => ({ ...current, participacao: current.participacao.filter((entry) => entry.clientId !== item.clientId) }))}><FontAwesomeIcon icon={faTrashCan} /></button>
          </div>
        ))}
        <div className="section-footer">
          <button type="button" className="secondary" onClick={addNationalLocation}><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar</span></button>
        </div>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Localidades Internacionais</h2>
        </div>
        {draft.membros_internacionais.map((item, index) => (
          <div className="repeat-row repeat-row--international repeat-row--compact-quantity repeat-row--unseparated" key={item.clientId} onKeyDown={(event) => addRowOnEnter(event, addInternationalLocation)}>
            <label>{index === 0 && <span>País</span>}<TextAutocomplete id={`international-country-${item.clientId}`} ariaLabel={index === 0 ? undefined : "País"} required value={item.pais} placeholder="Digite o país..." suggestions={paisSuggestions} onChange={(value) => setDraft((current) => ({ ...current, membros_internacionais: current.membros_internacionais.map((entry) => entry.clientId === item.clientId ? { ...entry, pais: value } : entry) }))} /></label>
            <NumberStepper
              id={`international-count-${item.clientId}`}
              label="Quantidade"
              showLabel={index === 0}
              value={item.presencas}
              min={1}
              max={100}
              onChange={(value) => setDraft((current) => ({ ...current, membros_internacionais: current.membros_internacionais.map((entry) => entry.clientId === item.clientId ? { ...entry, presencas: value } : entry) }))}
            />
            <button type="button" className="danger-icon-button" aria-label="Remover membro internacional" title="Remover membro internacional" onClick={() => setDraft((current) => ({ ...current, membros_internacionais: current.membros_internacionais.filter((entry) => entry.clientId !== item.clientId) }))}><FontAwesomeIcon icon={faTrashCan} /></button>
          </div>
        ))}
        {hasBrazilAsInternational && <p className="form-error" role="alert">Brasil deve ser cadastrado em Localidades nacionais.</p>}
        <div className="section-footer">
          <button type="button" className="secondary" onClick={addInternationalLocation}><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar</span></button>
        </div>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Visitantes</h2>
        </div>
        {draft.visitantes.map((item, index) => (
          <div className="repeat-row repeat-row--visitor repeat-row--unseparated" key={item.clientId} onKeyDown={(event) => addRowOnEnter(event, addVisitor)}>
            <div className="visitor-primary-row">
              <label htmlFor={`city-${item.clientId}`}>{index === 0 && <span>Cidade</span>}<MunicipioAutocomplete ariaLabel={index === 0 ? undefined : "Cidade do Visitante"} id={`city-${item.clientId}`} placeholder="Cidade..." value={item.cidade} onChange={(value) => setDraft((current) => ({ ...current, visitantes: current.visitantes.map((entry) => entry.clientId === item.clientId ? { ...entry, cidade: value } : entry) }))} /></label>
              <label>{index === 0 && <span>Descrição</span>}<select required aria-label={index === 0 ? undefined : "Descrição do Visitante"} value={item.descricao} onChange={(event) => setDraft((current) => ({ ...current, visitantes: current.visitantes.map((entry) => entry.clientId === item.clientId ? { ...entry, descricao: event.target.value as typeof entry.descricao } : entry) }))}><option value="" disabled>Escolha...</option>{categoriaVisitanteMapping.codes.map((code) => <option key={code} value={code}>{categoriaVisitanteMapping.toSheet(code)}</option>)}</select></label>
            </div>
            <div className="visitor-secondary-row">
              <label>{index === 0 && <span>Como Chegou a NA?</span>}<select required aria-label={index === 0 ? undefined : "Como o Visitante Chegou a NA"} value={item.como_chegou_a_na} onChange={(event) => setDraft((current) => ({ ...current, visitantes: current.visitantes.map((entry) => entry.clientId === item.clientId ? { ...entry, como_chegou_a_na: event.target.value as typeof entry.como_chegou_a_na } : entry) }))}><option value="" disabled>Escolha...</option>{origemContatoMapping.codes.map((code) => <option key={code} value={code}>{origemContatoMapping.toSheet(code)}</option>)}</select></label>
              <button type="button" className="danger-icon-button" aria-label="Remover visitante" title="Remover visitante" onClick={() => removeVisitante(item.clientId)}><FontAwesomeIcon icon={faTrashCan} /></button>
            </div>
          </div>
        ))}
        <div className="section-footer">
          <button type="button" className="secondary" onClick={addVisitor}><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar</span></button>
        </div>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Ingressos</h2>
        </div>
        <div className="form-grid ata-participation-grid">
          <NumberStepper
            id="total-ingressos"
            label="Quantidade"
            value={draft.ingressos.length}
            min={0}
            max={draft.visitantes.length}
            onChange={updateIngressoCount}
          />
        </div>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Conquista</h2>
        </div>
        {draft.trocas_chaveiro.map((item, index) => (
          <div className="repeat-row repeat-row--double repeat-row--clean-time repeat-row--compact-quantity repeat-row--unseparated" key={item.clientId} onKeyDown={(event) => addRowOnEnter(event, addAchievement)}>
            <label>{index === 0 && <span>Tempo Limpo</span>}<select id={`clean-time-${item.clientId}`} aria-label={index === 0 ? undefined : "Tempo Limpo"} value={item.tempo_limpo} onChange={(event) => setDraft((current) => ({ ...current, trocas_chaveiro: current.trocas_chaveiro.map((entry) => entry.clientId === item.clientId ? { ...entry, tempo_limpo: event.target.value as typeof entry.tempo_limpo } : entry) }))}>{tempoLimpoMapping.codes.map((code) => <option key={code} value={code}>{tempoLimpoMapping.toSheet(code)}</option>)}</select></label>
            <NumberStepper
              id={`clean-time-count-${item.clientId}`}
              label="Quantidade"
              showLabel={index === 0}
              value={item.quantidade}
              min={1}
              onChange={(value) => setDraft((current) => ({ ...current, trocas_chaveiro: current.trocas_chaveiro.map((entry) => entry.clientId === item.clientId ? { ...entry, quantidade: value } : entry) }))}
            />
            <button type="button" className="danger-icon-button" aria-label="Remover conquista de tempo" title="Remover conquista de tempo" onClick={() => setDraft((current) => ({ ...current, trocas_chaveiro: current.trocas_chaveiro.filter((entry) => entry.clientId !== item.clientId) }))}><FontAwesomeIcon icon={faTrashCan} /></button>
          </div>
        ))}
        <div className="section-footer">
          <button type="button" className="secondary" onClick={addAchievement}><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar</span></button>
        </div>
      </section>

      <section className="card form-section" aria-labelledby="ata-summary-heading">
        <div className="section-heading"><h2 id="ata-summary-heading">Resumo</h2></div>
        <dl className="review-metrics" aria-label="Resumo calculado da ata">
          <div><dt>Servidores</dt><dd>{draft.servidores.length}</dd></div>
          <div><dt>Membros</dt><dd>{draft.ata.total_membros_presentes}</dd></div>
          <div><dt>Partilhas</dt><dd>{draft.ata.total_partilhas}</dd></div>
          <div><dt>Visitantes</dt><dd>{draft.visitantes.length}</dd></div><div><dt>Ingressos</dt><dd>{draft.ingressos.length}</dd></div>
          <div><dt>Conquistas</dt><dd>{draft.trocas_chaveiro.reduce((total, item) => total + item.quantidade, 0)}</dd></div><div><dt>Cidades</dt><dd>{new Set(draft.participacao.map((item) => item.localidade.trim().toLocaleLowerCase("pt-BR")).filter(Boolean)).size}</dd></div>
          <div><dt>Estados</dt><dd>{new Set(draft.participacao.map((item) => cidadeEstado(item.localidade).estado).filter((state) => state !== "-")).size}</dd></div><div><dt>Outros Países</dt><dd>{new Set(draft.membros_internacionais.map((item) => item.pais.trim().toLocaleLowerCase("pt-BR")).filter((country) => country && country !== "brasil")).size}</dd></div>
        </dl>
      </section>

      {revision && (
        <section className="card form-section">
          <label htmlFor="ata-revision-reason">Motivo da Alteração</label>
          <textarea
            id="ata-revision-reason"
            name="motivo_alteracao"
            value={revisionReason}
            onChange={(event) => setRevisionReason(event.target.value)}
            maxLength={1000}
            rows={3}
            required
          />
        </section>
      )}

      {(clientError || (!reviewing && actionState.error)) && (
        <p className="form-error" role="alert">{clientError ?? actionState.error}</p>
      )}
      <div className="form-footer">
        <button type="button" onClick={review} disabled={Boolean(platformPreflightError || hasBrazilAsInternational)}><span className="button-content"><FontAwesomeIcon icon={faClipboardCheck} />Revisar e confirmar</span></button>
      </div>

      {reviewing && (
        <div className="modal-backdrop">
          <section className="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
            <AtaReviewLayout
              title={revision ? "Resumo da revisão" : "Resumo da ata"}
              titleId="confirmation-title"
              data={reviewLayoutData}
              footer={(
                <>
                  {actionState.error && <p className="form-error" role="alert">{actionState.error}</p>}
                  <div className="modal-actions">
                    <button type="button" className="secondary" disabled={pending} autoFocus onClick={() => setReviewing(false)}><span className="button-content"><FontAwesomeIcon icon={faPenToSquare} />Corrigir</span></button>
                    <button type="submit" disabled={pending}><span className="button-content"><FontAwesomeIcon icon={faPaperPlane} />{pending ? "Salvando..." : revision?.approvalStatus === "pendente_revisao" ? "Enviar para revisão" : revision ? "Salvar revisão aprovada" : "Enviar"}</span></button>
                  </div>
                </>
              )}
            />
          </section>
        </div>
      )}
        </>
      )}
    </form>
  );
}
