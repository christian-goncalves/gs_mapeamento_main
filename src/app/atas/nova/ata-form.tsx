"use client";

import { useActionState, useRef, useState } from "react";
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
function clientId() {
  return globalThis.crypto.randomUUID();
}

function move<T>(items: T[], index: number, direction: -1 | 1) {
  const destination = index + direction;
  if (destination < 0 || destination >= items.length) return items;
  const next = [...items];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}

function submissionFromDraft(draft: Draft): HiddenAtaSubmission {
  return {
    ata: draft.ata,
    servidores: draft.servidores.map(({ nome }) => ({ nome })),
    participacao: draft.participacao.map(
      ({ localidade, presencas }) => ({
        localidade,
        presencas,
      }),
    ),
    visitantes: draft.visitantes.map(
      ({ anonimo, nome, cidade }) => ({
        anonimo,
        nome,
        cidade,
      }),
    ),
    ingressos: draft.ingressos.map(({ anonimo, nome }) => ({ anonimo, nome })),
    trocas_chaveiro: draft.trocas_chaveiro.map(({ tempo_limpo, quantidade }) => ({
      tempo_limpo,
      quantidade,
    })),
  };
}

export function AtaForm({
  groups,
  today,
}: {
  groups: { id: string; name: string }[];
  today: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [reviewing, setReviewing] = useState(false);
  const [clientError, setClientError] = useState<string>();
  const [actionState, formAction, pending] = useActionState(
    createAtaAction,
    initialActionState,
  );
  const [draft, setDraft] = useState<Draft>({
    ata: {
      grupo_id: groups[0].id,
      data_reuniao: today,
      hora_inicio: "20:00",
      plataforma: "zoom",
      tipo_reuniao: "aberta",
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

      <section className="card form-section">
        <h2>Informações gerais</h2>
        <div className="form-grid">
          <label>
            Grupo
            <select
              required
              value={draft.ata.grupo_id}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  ata: { ...current.ata, grupo_id: event.target.value },
                }))
              }
            >
              {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          </label>
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
              {horarios.map((time) => <option key={time}>{time}</option>)}
            </select>
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
            {tipoReuniaoMapping.codes.map((code) => (
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
        </fieldset>
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Servidores</h2>
          <button
            type="button"
            className="secondary"
            onClick={() => setDraft((current) => ({
              ...current,
              servidores: [...current.servidores, { clientId: clientId(), nome: "" }],
            }))}
          >Adicionar servidor</button>
        </div>
        {draft.servidores.map((item, index) => (
          <div className="repeat-row" key={item.clientId}>
            <label>Nome<input required value={item.nome} onChange={(event) => setDraft((current) => ({
              ...current,
              servidores: current.servidores.map((server) => server.clientId === item.clientId ? { ...server, nome: event.target.value } : server),
            }))} /></label>
            <div className="row-actions">
              <button type="button" className="icon-button" disabled={index === 0} onClick={() => setDraft((current) => ({ ...current, servidores: move(current.servidores, index, -1) }))} aria-label="Mover servidor para cima">↑</button>
              <button type="button" className="icon-button" disabled={index === draft.servidores.length - 1} onClick={() => setDraft((current) => ({ ...current, servidores: move(current.servidores, index, 1) }))} aria-label="Mover servidor para baixo">↓</button>
              <button type="button" className="danger-button" onClick={() => setDraft((current) => ({ ...current, servidores: current.servidores.filter((server) => server.clientId !== item.clientId) }))}>Remover</button>
            </div>
          </div>
        ))}
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Participação</h2>
          <button type="button" className="secondary" onClick={() => setDraft((current) => ({
            ...current,
            participacao: [...current.participacao, { clientId: clientId(), localidade: "", presencas: 1 }],
          }))}>Adicionar localidade</button>
        </div>
        <label className="narrow-field">
          Total de membros presentes
          <input type="number" required min={0} step={1} value={draft.ata.total_membros_presentes} onChange={(event) => setDraft((current) => ({
            ...current,
            ata: { ...current.ata, total_membros_presentes: Number(event.target.value) },
          }))} />
        </label>
        <label className="narrow-field">
          Total de partilhas
          <input type="number" required min={0} step={1} value={draft.ata.total_partilhas} onChange={(event) => setDraft((current) => ({
            ...current,
            ata: { ...current.ata, total_partilhas: Number(event.target.value) },
          }))} />
        </label>
        {draft.participacao.map((item, index) => (
          <div className="repeat-block" key={item.clientId}>
            <div className="form-grid">
              <label htmlFor={`participation-city-${item.clientId}`}>Localidade<MunicipioAutocomplete id={`participation-city-${item.clientId}`} value={item.localidade} onChange={(value) => setDraft((current) => ({ ...current, participacao: current.participacao.map((entry) => entry.clientId === item.clientId ? { ...entry, localidade: value } : entry) }))} /></label>
              <label>Presenças<input type="number" required min={1} step={1} value={item.presencas} onChange={(event) => setDraft((current) => ({ ...current, participacao: current.participacao.map((entry) => entry.clientId === item.clientId ? { ...entry, presencas: Number(event.target.value) } : entry) }))} /></label>
            </div>
            <div className="row-actions">
              <button type="button" className="icon-button" disabled={index === 0} onClick={() => setDraft((current) => ({ ...current, participacao: move(current.participacao, index, -1) }))} aria-label="Mover localidade para cima">↑</button>
              <button type="button" className="icon-button" disabled={index === draft.participacao.length - 1} onClick={() => setDraft((current) => ({ ...current, participacao: move(current.participacao, index, 1) }))} aria-label="Mover localidade para baixo">↓</button>
              <button type="button" className="danger-button" onClick={() => setDraft((current) => ({ ...current, participacao: current.participacao.filter((entry) => entry.clientId !== item.clientId) }))}>Remover</button>
            </div>
          </div>
        ))}
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Visitantes</h2>
          <button type="button" className="secondary" onClick={() => setDraft((current) => ({
            ...current,
            visitantes: [...current.visitantes, { clientId: clientId(), anonimo: true, nome: "", cidade: "" }],
          }))}>Adicionar visitante</button>
        </div>
        {draft.visitantes.map((item, index) => (
          <div className="repeat-block" key={item.clientId}>
            <div className="form-grid">
              <label className="choice">
                <input
                  type="checkbox"
                  checked={!item.anonimo}
                  onChange={(event) => setDraft((current) => ({ ...current, visitantes: current.visitantes.map((entry) => entry.clientId === item.clientId ? { ...entry, anonimo: !event.target.checked, nome: event.target.checked ? entry.nome : "" } : entry) }))}
                />
                Informar nome
              </label>
              {item.anonimo ? (
                <div><span className="muted">Anônimo</span></div>
              ) : (
                <label>Nome<input required value={item.nome ?? ""} onChange={(event) => setDraft((current) => ({ ...current, visitantes: current.visitantes.map((entry) => entry.clientId === item.clientId ? { ...entry, nome: event.target.value } : entry) }))} /></label>
              )}
              <label htmlFor={`city-${item.clientId}`}>Cidade<MunicipioAutocomplete id={`city-${item.clientId}`} value={item.cidade} onChange={(value) => setDraft((current) => ({ ...current, visitantes: current.visitantes.map((entry) => entry.clientId === item.clientId ? { ...entry, cidade: value } : entry) }))} /></label>
            </div>
            <div className="row-actions">
              <button type="button" className="icon-button" disabled={index === 0} onClick={() => setDraft((current) => ({ ...current, visitantes: move(current.visitantes, index, -1) }))} aria-label="Mover visitante para cima">↑</button>
              <button type="button" className="icon-button" disabled={index === draft.visitantes.length - 1} onClick={() => setDraft((current) => ({ ...current, visitantes: move(current.visitantes, index, 1) }))} aria-label="Mover visitante para baixo">↓</button>
              <button type="button" className="danger-button" onClick={() => setDraft((current) => ({ ...current, visitantes: current.visitantes.filter((entry) => entry.clientId !== item.clientId) }))}>Remover</button>
            </div>
          </div>
        ))}
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Ingressos</h2>
          <button type="button" className="secondary" onClick={() => setDraft((current) => ({
            ...current,
            ingressos: [...current.ingressos, { clientId: clientId(), anonimo: true, nome: "" }],
          }))}>Adicionar ingresso</button>
        </div>
        {draft.ingressos.map((item, index) => (
          <div className="repeat-row" key={item.clientId}>
            <label className="choice">
              <input
                type="checkbox"
                checked={!item.anonimo}
                onChange={(event) => setDraft((current) => ({ ...current, ingressos: current.ingressos.map((entry) => entry.clientId === item.clientId ? { ...entry, anonimo: !event.target.checked, nome: event.target.checked ? entry.nome : "" } : entry) }))}
              />
              Informar nome
            </label>
            {item.anonimo ? (
              <div><span className="muted">Anônimo</span></div>
            ) : (
              <label>Nome<input required value={item.nome ?? ""} onChange={(event) => setDraft((current) => ({ ...current, ingressos: current.ingressos.map((entry) => entry.clientId === item.clientId ? { ...entry, nome: event.target.value } : entry) }))} /></label>
            )}
            <div className="row-actions">
              <button type="button" className="icon-button" disabled={index === 0} onClick={() => setDraft((current) => ({ ...current, ingressos: move(current.ingressos, index, -1) }))} aria-label="Mover ingresso para cima">↑</button>
              <button type="button" className="icon-button" disabled={index === draft.ingressos.length - 1} onClick={() => setDraft((current) => ({ ...current, ingressos: move(current.ingressos, index, 1) }))} aria-label="Mover ingresso para baixo">↓</button>
              <button type="button" className="danger-button" onClick={() => setDraft((current) => ({ ...current, ingressos: current.ingressos.filter((entry) => entry.clientId !== item.clientId) }))}>Remover</button>
            </div>
          </div>
        ))}
      </section>

      <section className="card form-section">
        <div className="section-heading">
          <h2>Trocas de chaveiro</h2>
          <button type="button" className="secondary" onClick={() => setDraft((current) => ({
            ...current,
            trocas_chaveiro: [...current.trocas_chaveiro, { clientId: clientId(), tempo_limpo: "1M", quantidade: 1 }],
          }))}>Adicionar troca</button>
        </div>
        {draft.trocas_chaveiro.map((item, index) => (
          <div className="repeat-row" key={item.clientId}>
            <label>Tempo limpo<select value={item.tempo_limpo} onChange={(event) => setDraft((current) => ({ ...current, trocas_chaveiro: current.trocas_chaveiro.map((entry) => entry.clientId === item.clientId ? { ...entry, tempo_limpo: event.target.value as typeof entry.tempo_limpo } : entry) }))}>{tempoLimpoMapping.codes.map((code) => <option key={code} value={code}>{tempoLimpoMapping.toSheet(code)}</option>)}</select></label>
            <label>Quantidade<input type="number" required min={1} step={1} value={item.quantidade} onChange={(event) => setDraft((current) => ({ ...current, trocas_chaveiro: current.trocas_chaveiro.map((entry) => entry.clientId === item.clientId ? { ...entry, quantidade: Number(event.target.value) } : entry) }))} /></label>
            <div className="row-actions">
              <button type="button" className="icon-button" disabled={index === 0} onClick={() => setDraft((current) => ({ ...current, trocas_chaveiro: move(current.trocas_chaveiro, index, -1) }))} aria-label="Mover troca para cima">↑</button>
              <button type="button" className="icon-button" disabled={index === draft.trocas_chaveiro.length - 1} onClick={() => setDraft((current) => ({ ...current, trocas_chaveiro: move(current.trocas_chaveiro, index, 1) }))} aria-label="Mover troca para baixo">↓</button>
              <button type="button" className="danger-button" onClick={() => setDraft((current) => ({ ...current, trocas_chaveiro: current.trocas_chaveiro.filter((entry) => entry.clientId !== item.clientId) }))}>Remover</button>
            </div>
          </div>
        ))}
      </section>

      {(clientError || (!reviewing && actionState.error)) && (
        <p className="form-error" role="alert">{clientError ?? actionState.error}</p>
      )}
      <div className="form-footer">
        <button type="button" onClick={review}>Revisar e confirmar</button>
      </div>

      {reviewing && (
        <div className="modal-backdrop">
          <section className="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
            <h2 id="confirmation-title">Confirmar envio imutável</h2>
            <p className="muted">Confira todos os dados. Após o envio, a ata não poderá ser editada ou excluída pela aplicação.</p>
            <dl className="review-grid">
              <div><dt>Grupo</dt><dd>{selectedGroup?.name}</dd></div>
              <div><dt>Data e hora</dt><dd>{draft.ata.data_reuniao} às {draft.ata.hora_inicio}</dd></div>
              <div><dt>Plataforma</dt><dd>{plataformaMapping.toSheet(draft.ata.plataforma)}</dd></div>
              <div><dt>Tipo</dt><dd>{tipoReuniaoMapping.toSheet(draft.ata.tipo_reuniao)}</dd></div>
              <div><dt>Formatos</dt><dd>{draft.ata.formatos.map((code) => formatoMapping.toSheet(code)).join(", ")}</dd></div>
              <div><dt>Membros presentes</dt><dd>{draft.ata.total_membros_presentes}</dd></div>
              <div><dt>Partilhas</dt><dd>{draft.ata.total_partilhas}</dd></div>
            </dl>
            <div className="review-lists">
              <h3>Servidores ({draft.servidores.length})</h3>
              <ol>{draft.servidores.map((item) => <li key={item.clientId}>{item.nome}</li>)}</ol>
              <h3>Participação ({draft.participacao.length})</h3>
              <ul>{draft.participacao.map((item) => <li key={item.clientId}>{item.localidade} · {item.presencas} presenças</li>)}</ul>
              <h3>Visitantes ({draft.visitantes.length})</h3>
              <ul>{draft.visitantes.map((item) => <li key={item.clientId}>{item.anonimo ? "Anônimo" : item.nome} · {item.cidade}</li>)}</ul>
              <h3>Ingressos ({draft.ingressos.length})</h3>
              <ul>{draft.ingressos.map((item) => <li key={item.clientId}>{item.anonimo ? "Anônimo" : item.nome}</li>)}</ul>
              <h3>Trocas de chaveiro ({draft.trocas_chaveiro.reduce((total, item) => total + item.quantidade, 0)})</h3>
              <ul>{draft.trocas_chaveiro.map((item) => <li key={item.clientId}>{tempoLimpoMapping.toSheet(item.tempo_limpo)} · {item.quantidade}</li>)}</ul>
            </div>
            {actionState.error && <p className="form-error" role="alert">{actionState.error}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary" disabled={pending} autoFocus onClick={() => setReviewing(false)}>Voltar e corrigir</button>
              <button type="submit" disabled={pending}>{pending ? "Enviando..." : "Confirmar e enviar"}</button>
            </div>
          </section>
        </div>
      )}
    </form>
  );
}
