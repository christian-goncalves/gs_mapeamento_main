"use client";

import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFloppyDisk,
  faClockRotateLeft,
  faPenToSquare,
  faPlus,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  KNOWN_MESA_OFFICES,
  isVacantMesaName,
} from "@/domain/grupo-servidores-mesa";
import { mesaServerClosureDetailOptions } from "@/domain/mesa-server-closure";
import { ChoiceAutocomplete } from "../choice-autocomplete";
import type { GrupoServidorMesa } from "@/domain/schemas";
import {
  closeGrupoServidorMesaAction,
  deleteGrupoServidorMesaAction,
  saveGrupoServidorMesaAction,
} from "./actions";
import { MesaServerClosureDialog } from "./mesa-server-closure-dialog";

type MesaServerItem = {
  clientId: string;
  grupo_servidor_mesa_id?: string;
  encargo: string;
  nome: string;
  data_inicio: string;
  ordem: number;
};

const subscribeToPortalTarget = () => () => {};
const getPortalTarget = () => document.body;
const getServerPortalTarget = () => null;

type PersistedMesaServerItem = MesaServerItem & {
  grupo_servidor_mesa_id: string;
};

function mesaServerItems(servidores: readonly GrupoServidorMesa[]) {
  return servidores
    .filter((item) => item.ativo)
    .sort(
      (first, second) =>
        first.ordem - second.ordem ||
        first.encargo.localeCompare(second.encargo, "pt-BR"),
    )
    .map<MesaServerItem>((item) => ({
      clientId: item.grupo_servidor_mesa_id,
      grupo_servidor_mesa_id: item.grupo_servidor_mesa_id,
      encargo: item.encargo,
      nome: item.nome || "vago",
      data_inicio: item.data_inicio,
      ordem: item.ordem,
    }));
}

function displayDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "Não informada";
}

function MesaServerModal({
  grupoId,
  item,
  onClose,
}: {
  grupoId: string;
  item: MesaServerItem;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(
    saveGrupoServidorMesaAction,
    null,
  );
  const [name, setName] = useState(item.nome);
  const initialKnownOffice = KNOWN_MESA_OFFICES.some(
    (office) => office === item.encargo,
  );
  const [officeChoice, setOfficeChoice] = useState(
    initialKnownOffice ? item.encargo : item.encargo ? "outro" : "",
  );
  const [customOffice, setCustomOffice] = useState(
    initialKnownOffice ? "" : item.encargo,
  );
  const vacant = isVacantMesaName(name);
  const encargo = officeChoice === "outro" ? customOffice.trim() : officeChoice;

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, pending]);

  return createPortal(
    <div
      className="modal-backdrop mesa-server-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <form
        action={action}
        className="confirmation-modal mesa-server-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mesa-server-modal-title"
      >
        <header className="mesa-server-modal-header">
          <div>
            <h2 id="mesa-server-modal-title">
              {item.grupo_servidor_mesa_id ? "Editar Encargo" : "Adicionar Servidores"}
            </h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Fechar edição"
            title="Fechar"
            disabled={pending}
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <input type="hidden" name="grupo_id" value={grupoId} />
        <input type="hidden" name="settings_section" value="servers" />
        <input
          type="hidden"
          name="grupo_servidor_mesa_id"
          value={item.grupo_servidor_mesa_id ?? ""}
        />
        <input type="hidden" name="ordem" value={item.ordem} />
        <input type="hidden" name="encargo" value={encargo} />
        <div className="mesa-server-modal-fields">
          <label>
            Encargo
            <ChoiceAutocomplete
              id="mesa-server-office"
              name="encargo_tipo"
              required
              value={officeChoice}
              options={[
                ...KNOWN_MESA_OFFICES.map((office) => ({ value: office, label: office })),
                { value: "outro", label: "Outro" },
              ]}
              onChange={(choice) => {
                setOfficeChoice(choice);
                if (choice !== "outro") setCustomOffice("");
              }}
            />
          </label>
          {officeChoice === "outro" && (
            <label>
              Nome do encargo
              <input
                value={customOffice}
                required
                onChange={(event) => setCustomOffice(event.target.value)}
              />
            </label>
          )}
          <label>
            Nome do Servidor
            <input
              name="nome"
              value={name}
              className={vacant ? "mesa-vacant-input" : undefined}
              onFocus={(event) => {
                if (vacant) event.currentTarget.select();
              }}
              onClick={(event) => {
                if (vacant) event.currentTarget.select();
              }}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Desde
            <input
              type="date"
              name="data_inicio"
              defaultValue={vacant ? "" : item.data_inicio}
              disabled={vacant}
              required={!vacant}
              className={vacant ? "mesa-vacant-date" : undefined}
            />
            {vacant && <input type="hidden" name="data_inicio" value="" />}
          </label>
        </div>
        {state?.error && <p className="form-error" role="alert">{state.error}</p>}
        <div className="modal-actions mesa-server-modal-actions">
          <button type="submit" disabled={pending}>
            <span className="button-content">
              <FontAwesomeIcon icon={faFloppyDisk} />
              {pending ? "Salvando..." : "Salvar"}
            </span>
          </button>
          <button type="button" className="secondary" disabled={pending} onClick={onClose}>
            <span className="button-content">
              <FontAwesomeIcon icon={faXmark} />
              Cancelar
            </span>
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

function MesaServerActions({
  grupoId,
  item,
  disabled,
  onEdit,
  onClose,
}: {
  grupoId: string;
  item: MesaServerItem;
  disabled: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  const portalTarget = useSyncExternalStore(
    subscribeToPortalTarget,
    getPortalTarget,
    getServerPortalTarget,
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="row-actions schedule-actions">
      <button
        type="button"
        className="icon-button"
        aria-label={`Editar ${item.encargo}`}
        title="Editar"
        disabled={disabled}
        onClick={onEdit}
      >
        <FontAwesomeIcon icon={faPenToSquare} />
      </button>
      {item.grupo_servidor_mesa_id && (
        <button
          type="button"
          className="danger-icon-button mesa-server-close-button"
          aria-label={`Encerrar encargo ${item.encargo}`}
          title="Encerrar encargo"
          disabled={disabled}
          onClick={onClose}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}
      {item.grupo_servidor_mesa_id && (
        <button
          type="button"
          className="danger-icon-button"
          aria-label={`Excluir ${item.encargo}`}
          title="Excluir"
          disabled={disabled}
          onClick={() => setConfirmingDelete(true)}
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      )}
      {item.grupo_servidor_mesa_id && portalTarget && confirmingDelete && createPortal(
        <div
          className="modal-backdrop schedule-delete-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmingDelete(false);
          }}
        >
          <section
            className="confirmation-modal schedule-delete-modal mesa-server-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`mesa-server-delete-title-${item.clientId}`}
            onKeyDown={(event) => {
              if (event.key === "Escape") setConfirmingDelete(false);
            }}
          >
            <h2 id={`mesa-server-delete-title-${item.clientId}`}>Excluir definitivamente?</h2>
            <p>Esta ação não pode ser desfeita e o registro não constará no Histórico.</p>
            <form action={deleteGrupoServidorMesaAction}>
              <input type="hidden" name="grupo_id" value={grupoId} />
              <input type="hidden" name="settings_section" value="servers" />
              <input
                type="hidden"
                name="grupo_servidor_mesa_id"
                value={item.grupo_servidor_mesa_id}
              />
              <div className="modal-actions">
                <button autoFocus type="button" className="secondary" onClick={() => setConfirmingDelete(false)}>
                  <span className="button-content">
                    <FontAwesomeIcon icon={faXmark} />
                    Cancelar
                  </span>
                </button>
                <button type="submit" className="danger-button">
                  <span className="button-content">
                    <FontAwesomeIcon icon={faTrashCan} />
                    Excluir definitivamente
                  </span>
                </button>
              </div>
            </form>
          </section>
        </div>,
        portalTarget,
      )}
    </div>
  );
}

export function MesaServersSummary({
  grupoId,
  servidores,
  historyHref,
  disabled = false,
  informativeNotice = "",
  hideHeading = false,
}: {
  grupoId: string;
  servidores: GrupoServidorMesa[];
  historyHref?: string;
  disabled?: boolean;
  informativeNotice?: string;
  hideHeading?: boolean;
}) {
  const items = mesaServerItems(servidores);
  const detailSuggestions = mesaServerClosureDetailOptions(servidores);
  const [selected, setSelected] = useState<MesaServerItem | null>(null);
  const [closing, setClosing] = useState<PersistedMesaServerItem | null>(null);

  return (
    <section className="responsavel-config-section mesa-servers-section">
      {informativeNotice && (
        <p className="mesa-info-notice" role="status">{informativeNotice}</p>
      )}
      {!hideHeading && (
        <div className="mesa-servers-header">
          <div>
            <h2>Servidores</h2>
          </div>
        </div>
      )}
      <div className="table-wrap">
        {items.length > 0 ? (
          <table className="schedule-summary-table mesa-summary-table mesa-summary-table-actions">
            <thead>
              <tr>
                <th>Encargo</th>
                <th>Servidor</th>
                <th>Desde</th>
                <th className="mesa-actions-heading">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const vacant = isVacantMesaName(item.nome);
                return (
                  <tr key={item.clientId}>
                    <th scope="row">{item.encargo}</th>
                    <td className={vacant ? "mesa-vacant-value" : undefined}>
                      {vacant ? "(vago)" : item.nome}
                    </td>
                    <td className={!item.data_inicio ? "mesa-vacant-value" : undefined}>
                      {item.data_inicio ? displayDate(item.data_inicio) : "—"}
                    </td>
                    <td className="mesa-actions-cell">
                      <MesaServerActions
                        grupoId={grupoId}
                        item={item}
                        disabled={disabled}
                        onEdit={() => setSelected(item)}
                        onClose={() => {
                          if (item.grupo_servidor_mesa_id) {
                            setClosing({
                              ...item,
                              grupo_servidor_mesa_id: item.grupo_servidor_mesa_id,
                            });
                          }
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">Nenhum encargo cadastrado para este grupo.</p>
        )}
      </div>
      <div className="section-footer schedule-view-footer mesa-server-footer-actions">
        <button
          type="button"
          className="group-wide-action mesa-add-button"
          disabled={disabled}
          onClick={() =>
            setSelected({
              clientId: `new-${items.length + 1}`,
              encargo: "",
              nome: "vago",
              data_inicio: "",
              ordem: Math.max(0, ...items.map((item) => item.ordem)) + 1,
            })
          }
        >
          <span className="button-content">
            <FontAwesomeIcon icon={faPlus} />
            Adicionar
          </span>
        </button>
        <Link href={historyHref ?? "#"} className="secondary mesa-history-button">
          <span className="button-content">
            <FontAwesomeIcon icon={faClockRotateLeft} />
            Histórico
          </span>
        </Link>
      </div>
      {selected && (
        <MesaServerModal
          key={selected.clientId}
          grupoId={grupoId}
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}
      {closing && (
        <MesaServerClosureDialog
          grupoId={grupoId}
          item={closing}
          detailSuggestions={detailSuggestions}
          action={closeGrupoServidorMesaAction}
          onClose={() => setClosing(null)}
        />
      )}
    </section>
  );
}
