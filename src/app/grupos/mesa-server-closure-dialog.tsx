"use client";

import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faFloppyDisk, faXmark } from "@fortawesome/free-solid-svg-icons";
import {
  MESA_SERVER_CLOSURE_LEGACY_OTHER,
  MESA_SERVER_CLOSURE_MOTIVES,
  MESA_SERVER_CLOSURE_PERSONALIZED,
} from "@/domain/mesa-server-closure";
import { TextAutocomplete } from "../atas/nova/text-autocomplete";
import type { SaveGrupoState } from "./actions";

type ClosureAction = (
  state: SaveGrupoState,
  formData: FormData,
) => Promise<SaveGrupoState>;

const subscribeToPortalTarget = () => () => {};
const getPortalTarget = () => document.body;
const getServerPortalTarget = () => null;

function todayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isoToBrazilianDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

function brazilianDateToIso(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return "";
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  return new Date(`${iso}T00:00:00.000Z`).toISOString().slice(0, 10) === iso
    ? iso
    : "";
}

function maskDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function MesaServerClosureDialog({
  grupoId,
  item,
  detailSuggestions = [],
  action,
  correction = false,
  onClose,
}: {
  grupoId: string;
  item: {
    grupo_servidor_mesa_id: string;
    encargo: string;
    nome: string;
    data_inicio: string;
    data_encerramento?: string;
    motivo_encerramento?: (typeof MESA_SERVER_CLOSURE_MOTIVES)[number] | typeof MESA_SERVER_CLOSURE_LEGACY_OTHER;
    motivo_encerramento_detalhe?: string;
  };
  detailSuggestions?: string[];
  action: ClosureAction;
  correction?: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [dateText, setDateText] = useState(
    isoToBrazilianDate(item.data_encerramento || todayInSaoPaulo()),
  );
  const [motive, setMotive] = useState(
    item.motivo_encerramento === MESA_SERVER_CLOSURE_LEGACY_OTHER
      ? MESA_SERVER_CLOSURE_PERSONALIZED
      : item.motivo_encerramento ?? "",
  );
  const [detail, setDetail] = useState(item.motivo_encerramento_detalhe ?? "");
  const portalTarget = useSyncExternalStore(
    subscribeToPortalTarget,
    getPortalTarget,
    getServerPortalTarget,
  );
  const isoDate = brazilianDateToIso(dateText);
  const today = todayInSaoPaulo();

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, pending]);

  if (!portalTarget) return null;
  return createPortal(
    <div
      className="modal-backdrop mesa-server-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <form
        action={formAction}
        className="confirmation-modal mesa-server-modal mesa-server-closure-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mesa-server-closure-title"
      >
        <header className="mesa-server-modal-header">
          <h2 id="mesa-server-closure-title">
            {correction ? "Corrigir encerramento do encargo" : "Encerramento do encargo"}
          </h2>
          <button type="button" className="icon-button" title="Fechar" aria-label="Fechar diálogo" disabled={pending} onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>
        <p className="mesa-server-closure-identification">
          {item.encargo} – {item.nome}
        </p>
        <input type="hidden" name="grupo_id" value={grupoId} />
        <input type="hidden" name="grupo_servidor_mesa_id" value={item.grupo_servidor_mesa_id} />
        <input type="hidden" name="settings_section" value="servers" />
        <input
          type="hidden"
          name="motivo_encerramento_detalhe"
          value={motive === MESA_SERVER_CLOSURE_PERSONALIZED ? detail : ""}
        />
        <div className="mesa-server-modal-fields">
          <label>
            Data do Encerramento
            <span className="mesa-server-date-controls">
              <input
                name="data_encerramento"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="dd/mm/aaaa"
                value={dateText}
                maxLength={10}
                pattern="\d{2}/\d{2}/\d{4}"
                required
                aria-label="Data do Encerramento, formato dia mês ano"
                onChange={(event) => setDateText(maskDate(event.target.value))}
              />
              <span className="mesa-server-calendar-wrap">
                <FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" />
                <input
                  type="date"
                  aria-label="Selecionar Data do Encerramento no calendário"
                  value={isoDate}
                  min={item.data_inicio || undefined}
                  max={today}
                  onChange={(event) => setDateText(isoToBrazilianDate(event.target.value))}
                />
              </span>
            </span>
          </label>
          <label>
            Motivo
            <select name="motivo_encerramento" value={motive} required onChange={(event) => setMotive(event.target.value as typeof motive)}>
              <option value="" disabled>Selecione um motivo</option>
              {MESA_SERVER_CLOSURE_MOTIVES.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          {motive === MESA_SERVER_CLOSURE_PERSONALIZED && (
            <label>
              Detalhe
              <TextAutocomplete
                id="mesa-server-closure-detail"
                required
                maxLength={25}
                value={detail}
                suggestions={detailSuggestions}
                placeholder="Selecione ou informe um detalhe"
                onChange={setDetail}
              />
            </label>
          )}
        </div>
        {state?.error && <p className="form-error" role="alert">{state.error}</p>}
        <div className="modal-actions mesa-server-modal-actions">
          <button type="submit" disabled={pending || !isoDate}>
            <span className="button-content"><FontAwesomeIcon icon={faFloppyDisk} />{pending ? "Salvando..." : correction ? "Salvar correção" : "Confirmar encerramento"}</span>
          </button>
          <button type="button" className="secondary" disabled={pending} onClick={onClose}>
            <span className="button-content"><FontAwesomeIcon icon={faXmark} />Cancelar</span>
          </button>
        </div>
      </form>
    </div>,
    portalTarget,
  );
}
