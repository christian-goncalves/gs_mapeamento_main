"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardCheck,
  faPaperPlane,
  faPenToSquare,
  faPlus,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import type { HiddenAtaSubmission } from "@/domain/hidden-submission";
import type { Plataforma } from "@/domain/enums";
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
import { createAtaAction, type CreateAtaState } from "./actions";
import { AtaReviewLayout, type AtaReviewLayoutData } from "../ata-review-layout";
import { MunicipioAutocomplete } from "./municipio-autocomplete";
import { TextAutocomplete } from "./text-autocomplete";

type ClientRow = { clientId: string };
type VisitorSubmission = HiddenAtaSubmission["visitantes"][number];
type VisitorDraft = Omit<
  VisitorSubmission,
  "descricao" | "como_chegou_a_na"
> & {
  descricao: VisitorSubmission["descricao"] | "";
  como_chegou_a_na: VisitorSubmission["como_chegou_a_na"] | "";
  has_ingresso: boolean;
};
type Draft = Omit<
  HiddenAtaSubmission,
  "servidores" | "participacao" | "membros_internacionais" | "visitantes" | "ingressos" | "trocas_chaveiro"
> & {
  servidores: (HiddenAtaSubmission["servidores"][number] & ClientRow)[];
  participacao: (HiddenAtaSubmission["participacao"][number] & ClientRow)[];
  membros_internacionais: (HiddenAtaSubmission["membros_internacionais"][number] & ClientRow)[];
  visitantes: (VisitorDraft & ClientRow)[];
  trocas_chaveiro: (HiddenAtaSubmission["trocas_chaveiro"][number] & ClientRow)[];
  legacyIngressos: ({ nome?: string; cidade?: string } & ClientRow)[];
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
const servidorFuncaoOptions = servidorFuncoes;

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
    ingressos: [
      ...draft.visitantes.flatMap((visitor, visitante_indice) =>
        visitor.has_ingresso ? [{ visitante_indice }] : [],
      ),
      ...draft.legacyIngressos.map(({ nome, cidade }) => ({ nome, cidade })),
    ],
    trocas_chaveiro: draft.trocas_chaveiro.map(({ tempo_limpo, quantidade }) => ({
      tempo_limpo,
      quantidade,
    })),
  };
}

function draftFromSubmission(submission: HiddenAtaSubmission): Draft {
  const linkedVisitors = new Set(
    submission.ingressos.flatMap((item) =>
      item.visitante_indice === undefined ? [] : [item.visitante_indice],
    ),
  );
  return {
    ata: submission.ata,
    servidores: submission.servidores.map((item) => ({ ...item, clientId: clientId() })),
    participacao: submission.participacao.map((item) => ({ ...item, clientId: clientId() })),
    membros_internacionais: submission.membros_internacionais.map((item) => ({ ...item, clientId: clientId() })),
    visitantes: submission.visitantes.map((item, index) => ({
      ...item,
      clientId: clientId(),
      has_ingresso: linkedVisitors.has(index),
    })),
    trocas_chaveiro: submission.trocas_chaveiro.map((item) => ({ ...item, clientId: clientId() })),
    legacyIngressos: submission.ingressos.flatMap((item) =>
      item.visitante_indice === undefined
        ? [{ nome: item.nome, cidade: item.cidade, clientId: clientId() }]
        : [],
    ),
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
    horarios?: { dia_semana: string; hora_inicio: string; link_reuniao: string }[];
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
  const initialTime = initialGroup?.horarios?.[0]?.hora_inicio ?? "20:00";
  const [draft, setDraft] = useState<Draft>(() => initialSubmission
    ? draftFromSubmission(initialSubmission)
    : {
        ata: {
          grupo_id: initialGroupId,
          data_reuniao: today,
          hora_inicio: initialTime,
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
        trocas_chaveiro: [],
        legacyIngressos: [],
      });
  const [revisionReason, setRevisionReason] = useState("");
  const submission = submissionFromDraft(draft);
  const selectedGroup = groups.find((group) => group.id === draft.ata.grupo_id);
  const paisSuggestions = paises.map((pais) => pais.nome);
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
    platform: plataformaMapping.toSheet(draft.ata.plataforma),
    meetingType: tipoReuniaoMapping.toSheet(draft.ata.tipo_reuniao),
    formats: draft.ata.formatos.map((code) => formatoMapping.toSheet(code)).join(", "),
    membersPresent: draft.ata.total_membros_presentes,
    shares: draft.ata.total_partilhas,
    additionalInformation: revision && revisionReason.trim()
      ? [{ label: "Motivo da alteração", value: revisionReason.trim() }]
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
    visitors: draft.visitantes.map((item, index) => ({
      id: item.clientId,
      label: `Visitante ${index + 1}`,
      city: item.cidade,
      category: item.descricao
        ? categoriaVisitanteMapping.toSheet(item.descricao)
        : "Não informado",
      origin: item.como_chegou_a_na
        ? origemContatoMapping.toSheet(item.como_chegou_a_na)
        : "Não informada",
    })),
    admissions: draft.visitantes.flatMap((item) => {
      if (!item.has_ingresso) return [];
      const location = cidadeEstado(item.cidade);
      return {
        id: `${item.clientId}-ingresso`,
        label: `Ingresso ${draft.visitantes.filter((visitor) => visitor.has_ingresso).findIndex((visitor) => visitor.clientId === item.clientId) + 1}`,
        city: location.cidade,
        state: location.estado,
      };
    }).concat(draft.legacyIngressos.map((item) => ({
      id: item.clientId,
      label: item.nome || "Ingresso",
      city: item.cidade || "",
      state: cidadeEstado(item.cidade || "").estado,
    }))),
    achievements: reviewConquistasTempo.map((item, index) => ({
      id: item.id,
      label: `Conquista ${index + 1}`,
      time: item.tempo,
    })),
    supplementalMetrics: {
      cities: new Set(draft.participacao.map((item) => item.localidade.trim().toLocaleLowerCase("pt-BR")).filter(Boolean)).size,
      states: new Set(draft.participacao.map((item) => cidadeEstado(item.localidade).estado).filter((state) => state !== "-")).size,
      otherCountries: new Set(draft.membros_internacionais.map((item) => item.pais.trim().toLocaleLowerCase("pt-BR")).filter((country) => country && country !== "brasil")).size,
    },
  };
  const horarioOptions = Array.from(
    new Set(
      (selectedGroup?.horarios?.length
        ? selectedGroup.horarios.map((horario) => horario.hora_inicio)
        : horarios),
    ),
  ).sort();

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

  function removeVisitante(clientIdToRemove: string) {
    setDraft((current) => ({
      ...current,
      visitantes: current.visitantes.filter(
        (item) => item.clientId !== clientIdToRemove,
      ),
    }));
  }

  function review() {
    setClientError(undefined);
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
        <h2>Informações gerais</h2>
        <div className="form-grid ata-general-info-grid">
          {!fixedGroupId && (
            <label className="ata-group-field">
              Grupo
              <select
                required
                value={draft.ata.grupo_id}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    ata: {
                      ...current.ata,
                      grupo_id: event.target.value,
                      plataforma:
                        groups.find((group) => group.id === event.target.value)
                          ?.plataforma ?? current.ata.plataforma,
                      hora_inicio:
                        groups.find((group) => group.id === event.target.value)
                          ?.horarios?.[0]?.hora_inicio ?? current.ata.hora_inicio,
                    },
                  }))
                }
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
              onChange={(event) => setDraft((current) => ({
                ...current,
                ata: { ...current.ata, data_reuniao: event.target.value },
              }))}
            />
          </label>
          <label>
            Horário
            <select
              required
              value={draft.ata.hora_inicio}
              onChange={(event) => setDraft((current) => ({
                ...current,
                ata: { ...current.ata, hora_inicio: event.target.value },
              }))}
            >
              {horarioOptions.map((time) => <option key={time}>{time}</option>)}
            </select>
          </label>
          <label className="ata-platform-field">
            Plataforma
            <select value={draft.ata.plataforma} disabled>
              {plataformaMapping.codes.map((code) => (
                <option key={code} value={code}>{plataformaMapping.toSheet(code)}</option>
              ))}
            </select>
          </label>
        </div>

        <fieldset>
          <legend>Tipo de reunião</legend>
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
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Servidores</h2>
        </div>
        {draft.servidores.map((item, index) => (
          <div className="repeat-row repeat-row--double repeat-row--server repeat-row--unseparated" key={item.clientId}>
            <label>{index === 0 && <span>Nome</span>}<TextAutocomplete ariaLabel={index === 0 ? undefined : "Nome do servidor"} required value={item.nome} placeholder="Nome..." suggestions={nameSuggestions.servidores} onChange={(value) => setDraft((current) => ({
              ...current,
              servidores: current.servidores.map((server) => server.clientId === item.clientId ? { ...server, nome: value } : server),
            }))} /></label>
            <label>{index === 0 && <span>Função</span>}<select aria-label={index === 0 ? undefined : "Função do servidor"} value={item.funcao ?? ""} onChange={(event) => setDraft((current) => ({
              ...current,
              servidores: current.servidores.map((server) => server.clientId === item.clientId ? { ...server, funcao: event.target.value } : server),
            }))}>
              <option value="">Selecione...</option>
              {servidorFuncaoOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select></label>
            <button type="button" className="danger-icon-button" aria-label="Remover servidor" title="Remover servidor" onClick={() => setDraft((current) => ({ ...current, servidores: current.servidores.filter((server) => server.clientId !== item.clientId) }))}><FontAwesomeIcon icon={faTrashCan} /></button>
          </div>
        ))}
        <div className="section-footer">
          <button
            type="button"
            className="secondary"
            onClick={() => setDraft((current) => ({
              ...current,
              servidores: [...current.servidores, { clientId: clientId(), nome: "", funcao: "" }],
            }))}
          ><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar</span></button>
        </div>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Participação</h2>
        </div>
        <div className="form-grid ata-participation-grid">
          <NumberStepper
            id="total-membros-presentes"
            label="Membros presentes"
            value={draft.ata.total_membros_presentes}
            min={1}
            max={100}
            onChange={(value) => setDraft((current) => ({
              ...current,
              ata: { ...current.ata, total_membros_presentes: value },
            }))}
          />
          <NumberStepper
            id="total-partilhas"
            label="Total de partilhas"
            value={draft.ata.total_partilhas}
            min={1}
            max={30}
            onChange={(value) => setDraft((current) => ({
              ...current,
              ata: { ...current.ata, total_partilhas: value },
            }))}
          />
        </div>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Localidades nacionais</h2>
        </div>
        {draft.participacao.map((item, index) => (
          <div className="repeat-row repeat-row--city repeat-row--locality repeat-row--compact-quantity repeat-row--unseparated" key={item.clientId}>
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
          <button type="button" className="secondary" onClick={() => setDraft((current) => ({
            ...current,
            participacao: [...current.participacao, { clientId: clientId(), localidade: "", presencas: 1 }],
          }))}><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar</span></button>
        </div>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Localidades internacionais</h2>
        </div>
        {draft.membros_internacionais.map((item, index) => (
          <div className="repeat-row repeat-row--international repeat-row--compact-quantity repeat-row--unseparated" key={item.clientId}>
            <label>{index === 0 && <span>País</span>}<TextAutocomplete ariaLabel={index === 0 ? undefined : "País"} required value={item.pais} placeholder="Digite o país..." suggestions={paisSuggestions} onChange={(value) => setDraft((current) => ({ ...current, membros_internacionais: current.membros_internacionais.map((entry) => entry.clientId === item.clientId ? { ...entry, pais: value } : entry) }))} /></label>
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
        <div className="section-footer">
          <button type="button" className="secondary" onClick={() => setDraft((current) => ({
            ...current,
            membros_internacionais: [...current.membros_internacionais, { clientId: clientId(), pais: "", presencas: 1 }],
          }))}><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar</span></button>
        </div>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Visitantes</h2>
        </div>
        {draft.visitantes.map((item, index) => (
          <div className="repeat-row repeat-row--visitor repeat-row--unseparated" key={item.clientId}>
            <div className="visitor-primary-row">
              <label htmlFor={`city-${item.clientId}`}>{index === 0 && <span>Cidade</span>}<MunicipioAutocomplete ariaLabel={index === 0 ? undefined : "Cidade do visitante"} id={`city-${item.clientId}`} placeholder="Cidade..." value={item.cidade} onChange={(value) => setDraft((current) => ({ ...current, visitantes: current.visitantes.map((entry) => entry.clientId === item.clientId ? { ...entry, cidade: value } : entry) }))} /></label>
              <label>{index === 0 && <span>Descrição</span>}<select required aria-label={index === 0 ? undefined : "Descrição do visitante"} value={item.descricao} onChange={(event) => setDraft((current) => ({ ...current, visitantes: current.visitantes.map((entry) => entry.clientId === item.clientId ? { ...entry, descricao: event.target.value as typeof entry.descricao, has_ingresso: event.target.value === "provavel_adicto" && entry.has_ingresso } : entry) }))}><option value="" disabled>Escolha...</option>{categoriaVisitanteMapping.codes.map((code) => <option key={code} value={code}>{categoriaVisitanteMapping.toSheet(code)}</option>)}</select></label>
            </div>
            <div className="visitor-secondary-row">
              <label>{index === 0 && <span>Como chegou a NA?</span>}<select required aria-label={index === 0 ? undefined : "Como o visitante chegou a NA"} value={item.como_chegou_a_na} onChange={(event) => setDraft((current) => ({ ...current, visitantes: current.visitantes.map((entry) => entry.clientId === item.clientId ? { ...entry, como_chegou_a_na: event.target.value as typeof entry.como_chegou_a_na } : entry) }))}><option value="" disabled>Escolha...</option>{origemContatoMapping.codes.map((code) => <option key={code} value={code}>{origemContatoMapping.toSheet(code)}</option>)}</select></label>
              {item.descricao === "provavel_adicto" && <label className="choice"><input type="checkbox" checked={item.has_ingresso} onChange={(event) => setDraft((current) => ({ ...current, visitantes: current.visitantes.map((entry) => entry.clientId === item.clientId ? { ...entry, has_ingresso: event.target.checked } : entry) }))} />Ingresso</label>}
              <button type="button" className="danger-icon-button" aria-label="Remover visitante" title="Remover visitante" onClick={() => removeVisitante(item.clientId)}><FontAwesomeIcon icon={faTrashCan} /></button>
            </div>
          </div>
        ))}
        <div className="section-footer">
          <button type="button" className="secondary" onClick={() => setDraft((current) => ({
            ...current,
            visitantes: [...current.visitantes, { clientId: clientId(), cidade: "", descricao: "", como_chegou_a_na: "", has_ingresso: false }],
          }))}><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar</span></button>
        </div>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Conquista</h2>
        </div>
        {draft.trocas_chaveiro.map((item, index) => (
          <div className="repeat-row repeat-row--double repeat-row--clean-time repeat-row--compact-quantity repeat-row--unseparated" key={item.clientId}>
            <label>{index === 0 && <span>Tempo limpo</span>}<select aria-label={index === 0 ? undefined : "Tempo limpo"} value={item.tempo_limpo} onChange={(event) => setDraft((current) => ({ ...current, trocas_chaveiro: current.trocas_chaveiro.map((entry) => entry.clientId === item.clientId ? { ...entry, tempo_limpo: event.target.value as typeof entry.tempo_limpo } : entry) }))}>{tempoLimpoMapping.codes.map((code) => <option key={code} value={code}>{tempoLimpoMapping.toSheet(code)}</option>)}</select></label>
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
          <button type="button" className="secondary" onClick={() => setDraft((current) => ({
            ...current,
            trocas_chaveiro: [...current.trocas_chaveiro, { clientId: clientId(), tempo_limpo: "dias_30", quantidade: 1 }],
          }))}><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar</span></button>
        </div>
      </section>

      <section className="card form-section" aria-labelledby="ata-summary-heading">
        <div className="section-heading"><h2 id="ata-summary-heading">Resumo</h2></div>
        <dl className="review-metrics" aria-label="Resumo calculado da ata">
          <div><dt>Servidores</dt><dd>{draft.servidores.length}</dd></div>
          <div><dt>Membros</dt><dd>{draft.ata.total_membros_presentes}</dd></div>
          <div><dt>Partilhas</dt><dd>{draft.ata.total_partilhas}</dd></div>
          <div><dt>Visitantes</dt><dd>{draft.visitantes.length}</dd></div><div><dt>Ingressos</dt><dd>{draft.visitantes.filter((item) => item.has_ingresso).length + draft.legacyIngressos.length}</dd></div>
          <div><dt>Conquistas</dt><dd>{draft.trocas_chaveiro.reduce((total, item) => total + item.quantidade, 0)}</dd></div><div><dt>Cidades</dt><dd>{new Set(draft.participacao.map((item) => item.localidade.trim().toLocaleLowerCase("pt-BR")).filter(Boolean)).size}</dd></div>
          <div><dt>Estados</dt><dd>{new Set(draft.participacao.map((item) => cidadeEstado(item.localidade).estado).filter((state) => state !== "-")).size}</dd></div><div><dt>Outros países</dt><dd>{new Set(draft.membros_internacionais.map((item) => item.pais.trim().toLocaleLowerCase("pt-BR")).filter((country) => country && country !== "brasil")).size}</dd></div>
        </dl>
      </section>

      {revision && (
        <section className="card form-section">
          <label htmlFor="ata-revision-reason">Motivo da alteração</label>
          <textarea
            id="ata-revision-reason"
            name="motivo_alteracao"
            value={revisionReason}
            onChange={(event) => setRevisionReason(event.target.value)}
            maxLength={1000}
            rows={3}
            required
          />
          {draft.legacyIngressos.length > 0 && (
            <p className="muted">{draft.legacyIngressos.length} ingresso(s) sem vínculo com visitante serão preservados nesta revisão.</p>
          )}
        </section>
      )}

      {(clientError || (!reviewing && actionState.error)) && (
        <p className="form-error" role="alert">{clientError ?? actionState.error}</p>
      )}
      <div className="form-footer">
        <button type="button" onClick={review}><span className="button-content"><FontAwesomeIcon icon={faClipboardCheck} />Revisar e confirmar</span></button>
      </div>

      {reviewing && (
        <div className="modal-backdrop">
          <section className="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
            <AtaReviewLayout
              title={revision ? "Resumo da revisão" : "Resumo da ata"}
              titleId="confirmation-title"
              data={reviewLayoutData}
              showFilledBy={false}
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
    </form>
  );
}
