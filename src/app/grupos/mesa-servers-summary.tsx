"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisVertical,
  faFloppyDisk,
  faPenToSquare,
  faPlus,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  KNOWN_MESA_OFFICES,
  isVacantMesaName,
} from "@/domain/grupo-servidores-mesa";
import type { GrupoServidorMesa } from "@/domain/schemas";
import {
  deactivateGrupoServidorMesaAction,
  saveGrupoServidorMesaAction,
} from "./actions";

type MesaServerItem = {
  clientId: string;
  grupo_servidor_mesa_id?: string;
  encargo: string;
  nome: string;
  data_inicio: string;
  ordem: number;
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
              {item.grupo_servidor_mesa_id ? "Editar encargo" : "Adicionar servidores"}
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
            <select
              name="encargo_tipo"
              required
              value={officeChoice}
              onChange={(event) => {
                const choice = event.target.value;
                setOfficeChoice(choice);
                if (choice !== "outro") setCustomOffice("");
              }}
            >
              <option value="" disabled>Selecione um encargo</option>
              {KNOWN_MESA_OFFICES.map((office) => (
                <option key={office} value={office}>{office}</option>
              ))}
              <option value="outro">Outro</option>
            </select>
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
            Nome do servidor
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
            Cancelar
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
}: {
  grupoId: string;
  item: MesaServerItem;
  disabled: boolean;
  onEdit: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  function updatePosition() {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const menuWidth = Math.min(224, window.innerWidth - 16);
    const menuHeight = menuRef.current?.offsetHeight ?? 150;
    const left = Math.min(
      window.innerWidth - menuWidth - 8,
      Math.max(8, rect.right - menuWidth),
    );
    const top =
      window.innerHeight - rect.bottom >= menuHeight + 8
        ? rect.bottom + 8
        : Math.max(8, rect.top - menuHeight - 8);
    setPosition({ top, left });
  }

  useEffect(() => {
    if (!open) return;
    updatePosition();
    function closeOnPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="responsavel-action-menu-trigger"
        aria-label={`Abrir ações de ${item.encargo}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title="Ações"
        disabled={disabled}
        onClick={() => {
          if (!open) updatePosition();
          setOpen((current) => !current);
        }}
      >
        <FontAwesomeIcon icon={faEllipsisVertical} />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              className="responsavel-action-menu mesa-server-action-menu"
              role="menu"
              aria-label={`Ações de ${item.encargo}`}
              style={{ top: position.top, left: position.left }}
            >
              <button
                type="button"
                className="responsavel-action-menu-item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
              >
                <FontAwesomeIcon icon={faPenToSquare} />
                <span>Editar encargo</span>
              </button>
              {item.grupo_servidor_mesa_id && (
                <form
                  action={deactivateGrupoServidorMesaAction}
                  onSubmit={(event) => {
                    if (!window.confirm(`Remover o encargo ${item.encargo}?`)) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="grupo_id" value={grupoId} />
                  <input
                    type="hidden"
                    name="grupo_servidor_mesa_id"
                    value={item.grupo_servidor_mesa_id}
                  />
                  <button
                    type="submit"
                    className="responsavel-action-menu-item responsavel-action-menu-item-danger"
                    role="menuitem"
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                    <span>Remover encargo</span>
                  </button>
                </form>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function MesaServersSummary({
  grupoId,
  servidores,
  disabled = false,
  informativeNotice = "",
}: {
  grupoId: string;
  servidores: GrupoServidorMesa[];
  disabled?: boolean;
  informativeNotice?: string;
}) {
  const items = mesaServerItems(servidores);
  const [selected, setSelected] = useState<MesaServerItem | null>(null);

  return (
    <section className="responsavel-config-section mesa-servers-section">
      {informativeNotice && (
        <p className="mesa-info-notice" role="status">{informativeNotice}</p>
      )}
      <div className="mesa-servers-header">
        <div>
          <h2>Servidores da Mesa</h2>
        </div>
      </div>
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
      <div className="section-footer schedule-view-footer">
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
            Adicionar servidores
          </span>
        </button>
      </div>
      {selected && (
        <MesaServerModal
          key={selected.clientId}
          grupoId={grupoId}
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
