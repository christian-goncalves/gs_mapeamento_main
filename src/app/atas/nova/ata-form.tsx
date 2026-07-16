"use client";

import { useActionState, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardCheck,
  faPaperPlane,
  faPenToSquare,
  faPlus,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import type { HiddenAtaSubmission } from "@/domain/hidden-submission";
import {
  formatoMapping,
  plataformaMapping,
  tempoLimpoMapping,
  tipoReuniaoMapping,
} from "@/domain/enums";
import { createAtaAction, type CreateAtaState } from "./actions";
import { MunicipioAutocomplete } from "./municipio-autocomplete";

type ClientRow = { clientId: string };
type Draft = Omit<
  HiddenAtaSubmission,
  "servidores" | "participacao" | "visitantes" | "ingressos" | "trocas_chaveiro"
> & {
  servidores: (HiddenAtaSubmission["servidores"][number] & ClientRow)[];
  participacao: (HiddenAtaSubmission["participacao"][number] & ClientRow)[];
  visitantes: (HiddenAtaSubmission["visitantes"][number] & ClientRow)[];
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

function clientId() {
  return globalThis.crypto.randomUUID();
}

function NumberStepper({
  id,
  label,
  value,
  min = 1,
  max,
  onChange,
}: {
  id: string;
  label: string;
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
      {label}
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

function submissionFromDraft(draft: Draft): HiddenAtaSubmission {
  return {
    ata: draft.ata,
    servidores: draft.servidores.map(({ nome, funcao }) => ({ nome, funcao })),
    participacao: draft.participacao.map(
      ({ localidade, presencas }) => ({
        localidade,
        presencas,
      }),
    ),
    visitantes: draft.visitantes.map(
      ({ nome, cidade }) => ({
        nome,
        cidade,
      }),
    ),
    ingressos: draft.ingressos.map(({ nome, cidade }) => ({ nome, cidade })),
    trocas_chaveiro: draft.trocas_chaveiro.map(({ tempo_limpo, quantidade }) => ({
      tempo_limpo,
      quantidade,
    })),
  };
}

export function AtaForm({
  groups,
  today,
  action = createAtaAction,
  fixedGroupId,
  linkFormularioAta,
}: {
  groups: {
    id: string;
    name: string;
    horarios?: { dia_semana: string; hora_inicio: string; link_reuniao: string }[];
  }[];
  today: string;
  action?: (
    previousState: CreateAtaState,
    formData: FormData,
  ) => Promise<CreateAtaState>;
  fixedGroupId?: string;
  linkFormularioAta?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [reviewing, setReviewing] = useState(false);
  const [clientError, setClientError] = useState<string>();
  const [actionState, formAction, pending] = useActionState(
    action,
    initialActionState,
  );
  const initialGroupId = fixedGroupId ?? groups[0].id;
  const initialGroup = groups.find((group) => group.id === initialGroupId);
  const initialTime = initialGroup?.horarios?.[0]?.hora_inicio ?? "20:00";
  const [draft, setDraft] = useState<Draft>({
    ata: {
      grupo_id: initialGroupId,
      data_reuniao: today,
      hora_inicio: initialTime,
      duracao: "",
      formato_outros: "",
      preenchido_por: "",
      plataforma: "zoom",
      tipo_reuniao: "fechada",
      formatos: [],
      total_membros_presentes: 0,
      total_partilhas: 0,
    },
    servidores: [],
    participacao: [],
    visitantes: [],
    ingressos: [],
    trocas_chaveiro: [],
  });
  const submission = submissionFromDraft(draft);
  const selectedGroup = groups.find((group) => group.id === draft.ata.grupo_id);
  const horarioOptions = Array.from(
    new Set(
      (selectedGroup?.horarios?.length
        ? selectedGroup.horarios.map((horario) => horario.hora_inicio)
        : horarios),
    ),
  ).sort();

  function review() {
    setClientError(undefined);
    if (!formRef.current?.reportValidity()) return;
    if (draft.ata.formatos.length === 0) {
      setClientError("Selecione pelo menos um formato de reunião.");
      return;
    }
    const presencas = draft.participacao.reduce(
      (total, item) => total + item.presencas,
      0,
    );
    if (presencas > draft.ata.total_membros_presentes) {
      setClientError("A soma das presenças supera o total de membros presentes.");
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
      {linkFormularioAta && (
        <input type="hidden" name="link_formulario_ata" value={linkFormularioAta} />
      )}

      <section className="card form-section">
        <h2>Informações gerais</h2>
        <div className="form-grid">
          {!fixedGroupId && (
            <label>
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
          <label>
            Data da reunião
            <input
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
            Hora de início
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
          <label>
            Duração
            <input
              pattern="(?:[0-9]{1,2}):[0-5][0-9]"
              placeholder="Ex.: 1:30"
              title="Use o formato H:MM, por exemplo 1:30."
              value={draft.ata.duracao}
              onChange={(event) => setDraft((current) => ({
                ...current,
                ata: { ...current.ata, duracao: event.target.value },
              }))}
            />
          </label>
          <label>
            Preenchido por
            <input
              required
              placeholder="Preenchido por..."
              value={draft.ata.preenchido_por}
              onChange={(event) => setDraft((current) => ({
                ...current,
                ata: { ...current.ata, preenchido_por: event.target.value },
              }))}
            />
          </label>
          <label>
            Plataforma
            <select value={draft.ata.plataforma} disabled>
              <option value="zoom">Zoom</option>
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
          <h2>Participação</h2>
        </div>
        <div className="form-grid">
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
          <h2>Servidores</h2>
        </div>
        {draft.servidores.map((item) => (
          <div className="repeat-row repeat-row--double" key={item.clientId}>
            <label>Nome<input required value={item.nome} placeholder="Nome..." onChange={(event) => setDraft((current) => ({
              ...current,
              servidores: current.servidores.map((server) => server.clientId === item.clientId ? { ...server, nome: event.target.value } : server),
            }))} /></label>
            <label>Função<input value={item.funcao ?? ""} placeholder="Função..." onChange={(event) => setDraft((current) => ({
              ...current,
              servidores: current.servidores.map((server) => server.clientId === item.clientId ? { ...server, funcao: event.target.value } : server),
            }))} /></label>
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
          ><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar servidor</span></button>
        </div>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Localidade - Cidades (UF)</h2>
        </div>
        {draft.participacao.map((item) => (
          <div className="repeat-row repeat-row--city" key={item.clientId}>
            <label htmlFor={`participation-city-${item.clientId}`}>Cidade<MunicipioAutocomplete id={`participation-city-${item.clientId}`} placeholder="Cidade..." value={item.localidade} onChange={(value) => setDraft((current) => ({ ...current, participacao: current.participacao.map((entry) => entry.clientId === item.clientId ? { ...entry, localidade: value } : entry) }))} /></label>
            <NumberStepper
              id={`participation-count-${item.clientId}`}
              label="Quantidade"
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
          }))}><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar cidade</span></button>
        </div>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Visitantes</h2>
        </div>
        {draft.visitantes.map((item) => (
          <div className="repeat-row repeat-row--compact" key={item.clientId}>
            <label>Nome<input value={item.nome ?? ""} placeholder="Anônimo" onChange={(event) => setDraft((current) => ({ ...current, visitantes: current.visitantes.map((entry) => entry.clientId === item.clientId ? { ...entry, nome: event.target.value } : entry) }))} /></label>
            <label htmlFor={`city-${item.clientId}`}>Cidade<MunicipioAutocomplete id={`city-${item.clientId}`} placeholder="Cidade..." value={item.cidade} onChange={(value) => setDraft((current) => ({ ...current, visitantes: current.visitantes.map((entry) => entry.clientId === item.clientId ? { ...entry, cidade: value } : entry) }))} /></label>
            <button type="button" className="danger-icon-button" aria-label="Remover visitante" title="Remover visitante" onClick={() => setDraft((current) => ({ ...current, visitantes: current.visitantes.filter((entry) => entry.clientId !== item.clientId) }))}><FontAwesomeIcon icon={faTrashCan} /></button>
          </div>
        ))}
        <div className="section-footer">
          <button type="button" className="secondary" onClick={() => setDraft((current) => ({
            ...current,
            visitantes: [...current.visitantes, { clientId: clientId(), nome: "", cidade: "" }],
          }))}><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar visitante</span></button>
        </div>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Ingressos</h2>
        </div>
        {draft.ingressos.map((item) => (
          <div className="repeat-row repeat-row--double" key={item.clientId}>
            <label>Nome<input value={item.nome ?? ""} placeholder="Anônimo" onChange={(event) => setDraft((current) => ({ ...current, ingressos: current.ingressos.map((entry) => entry.clientId === item.clientId ? { ...entry, nome: event.target.value } : entry) }))} /></label>
            <label htmlFor={`ingresso-city-${item.clientId}`}>Cidade<MunicipioAutocomplete id={`ingresso-city-${item.clientId}`} placeholder="Cidade..." value={item.cidade} onChange={(value) => setDraft((current) => ({ ...current, ingressos: current.ingressos.map((entry) => entry.clientId === item.clientId ? { ...entry, cidade: value } : entry) }))} /></label>
            <button type="button" className="danger-icon-button" aria-label="Remover ingresso" title="Remover ingresso" onClick={() => setDraft((current) => ({ ...current, ingressos: current.ingressos.filter((entry) => entry.clientId !== item.clientId) }))}><FontAwesomeIcon icon={faTrashCan} /></button>
          </div>
        ))}
        <div className="section-footer">
          <button type="button" className="secondary" onClick={() => setDraft((current) => ({
            ...current,
            ingressos: [...current.ingressos, { clientId: clientId(), nome: "", cidade: "" }],
          }))}><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar ingresso</span></button>
        </div>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Conquistas de tempo</h2>
        </div>
        {draft.trocas_chaveiro.map((item) => (
          <div className="repeat-row repeat-row--double" key={item.clientId}>
            <label>Tempo limpo<select value={item.tempo_limpo} onChange={(event) => setDraft((current) => ({ ...current, trocas_chaveiro: current.trocas_chaveiro.map((entry) => entry.clientId === item.clientId ? { ...entry, tempo_limpo: event.target.value as typeof entry.tempo_limpo } : entry) }))}>{tempoLimpoMapping.codes.map((code) => <option key={code} value={code}>{tempoLimpoMapping.toSheet(code)}</option>)}</select></label>
            <NumberStepper
              id={`clean-time-count-${item.clientId}`}
              label="Quantidade"
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
            trocas_chaveiro: [...current.trocas_chaveiro, { clientId: clientId(), tempo_limpo: "1M", quantidade: 1 }],
          }))}><span className="button-content"><FontAwesomeIcon icon={faPlus} />Adicionar conquista</span></button>
        </div>
      </section>

      {(clientError || (!reviewing && actionState.error)) && (
        <p className="form-error" role="alert">{clientError ?? actionState.error}</p>
      )}
      <div className="form-footer">
        <button type="button" onClick={review}><span className="button-content"><FontAwesomeIcon icon={faClipboardCheck} />Revisar e confirmar</span></button>
      </div>

      {reviewing && (
        <div className="modal-backdrop">
          <section className="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
            <h2 id="confirmation-title">Resumo da ata</h2>
            <p className="muted">Confira os dados antes de enviar. Após a confirmação, a ata ficará registrada como somente leitura.</p>
            <dl className="review-grid">
              <div><dt>Grupo</dt><dd>{selectedGroup?.name}</dd></div>
              <div><dt>Data e hora</dt><dd>{draft.ata.data_reuniao} às {draft.ata.hora_inicio}</dd></div>
              {draft.ata.duracao && <div><dt>Duração</dt><dd>{draft.ata.duracao}</dd></div>}
              <div><dt>Preenchido por</dt><dd>{draft.ata.preenchido_por}</dd></div>
              <div><dt>Plataforma</dt><dd>{plataformaMapping.toSheet(draft.ata.plataforma)}</dd></div>
              <div><dt>Tipo</dt><dd>{tipoReuniaoMapping.toSheet(draft.ata.tipo_reuniao)}</dd></div>
              <div><dt>Formatos</dt><dd>{draft.ata.formatos.map((code) => formatoMapping.toSheet(code)).join(", ")}</dd></div>
              <div><dt>Membros presentes</dt><dd>{draft.ata.total_membros_presentes}</dd></div>
              <div><dt>Partilhas</dt><dd>{draft.ata.total_partilhas}</dd></div>
            </dl>
            <div className="review-lists">
              <h3>Servidores ({draft.servidores.length})</h3>
              <ol>{draft.servidores.map((item) => <li key={item.clientId}>{item.nome}{item.funcao ? ` · ${item.funcao}` : ""}</li>)}</ol>
              <h3>Localidade - Cidades (UF) ({draft.participacao.length})</h3>
              <ul>{draft.participacao.map((item) => <li key={item.clientId}>{item.localidade} · {item.presencas}</li>)}</ul>
              <h3>Visitantes ({draft.visitantes.length})</h3>
              <ul>{draft.visitantes.map((item) => <li key={item.clientId}>{item.nome?.trim() || "Anonimo"} · {item.cidade}</li>)}</ul>
              <h3>Ingressos ({draft.ingressos.length})</h3>
              <ul>{draft.ingressos.map((item) => <li key={item.clientId}>{item.nome?.trim() || "Anonimo"} · {item.cidade}</li>)}</ul>
              <h3>Conquistas de tempo ({draft.trocas_chaveiro.reduce((total, item) => total + item.quantidade, 0)})</h3>
              <ul>{draft.trocas_chaveiro.map((item) => <li key={item.clientId}>{tempoLimpoMapping.toSheet(item.tempo_limpo)} · {item.quantidade}</li>)}</ul>
            </div>
            {actionState.error && <p className="form-error" role="alert">{actionState.error}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary" disabled={pending} autoFocus onClick={() => setReviewing(false)}><span className="button-content"><FontAwesomeIcon icon={faPenToSquare} />Voltar e corrigir</span></button>
              <button type="submit" disabled={pending}><span className="button-content"><FontAwesomeIcon icon={faPaperPlane} />{pending ? "Enviando..." : "Confirmar e enviar"}</span></button>
            </div>
          </section>
        </div>
      )}
    </form>
  );
}
