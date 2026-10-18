"use client";

import { useActionState, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { deleteAtaAction } from "./lifecycle-actions";

export function AtaDeleteAction({
  ataId,
  updatedAt,
  onComplete,
}: {
  ataId: string;
  updatedAt: string;
  onComplete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAtaAction, {});

  function close() {
    setOpen(false);
    onComplete?.();
  }

  return (
    <>
      <button
        type="button"
        className="responsavel-action-menu-item responsavel-action-menu-item-danger"
        role="menuitem"
        onClick={() => setOpen(true)}
      >
        <FontAwesomeIcon icon={faTrashCan} />
        <span>Excluir</span>
      </button>
      {open && createPortal(
        <div className="modal-backdrop ata-delete-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}>
          <section
            className="confirmation-modal ata-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-ata-title"
          >
            <form action={action}>
              <h2 id="delete-ata-title">Excluir ata?</h2>
              <p>A ata sairá das listagens normais. O registro e os dados vinculados serão preservados no histórico.</p>
              <input type="hidden" name="ata_id" value={ataId} />
              <input type="hidden" name="updated_at" value={updatedAt} />
              <label>
                Motivo da exclusão
                <textarea name="motivo_alteracao" required maxLength={1000} rows={3} />
              </label>
              <label className="ata-delete-confirm-label">
                <input type="checkbox" name="confirmed" value="true" required />
                Confirmo a exclusão lógica desta ata.
              </label>
              {state.error && <p className="form-error" role="alert">{state.error}</p>}
              <div className="modal-actions">
                <button type="button" className="secondary" disabled={pending} onClick={close}>Cancelar</button>
                <button type="submit" className="danger-button" disabled={pending}>
                  {pending ? "Excluindo..." : "Excluir ata"}
                </button>
              </div>
            </form>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
