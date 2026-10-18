"use client";

import { useActionState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import {
  updateAtaIndexAction,
  type UpdateAtaIndexState,
} from "../actions";

export function AtaIndexForm({
  ataId,
  currentIndex,
}: {
  ataId: string;
  currentIndex: number;
}) {
  const [state, action, pending] = useActionState<UpdateAtaIndexState, FormData>(
    updateAtaIndexAction,
    null,
  );
  return (
    <form action={action} className="ata-index-form">
      <input type="hidden" name="ata_id" value={ataId} />
      <label>
        Índice personalizado do grupo
        <span className="ata-index-form-row">
          <input
            type="number"
            name="indice_personalizado_grupo"
            min={1}
            step={1}
            defaultValue={currentIndex}
            required
          />
          <button type="submit" className="icon-button" disabled={pending}>
            <span className="button-content">
              <FontAwesomeIcon icon={faFloppyDisk} />
              {pending ? "Salvando..." : "Salvar"}
            </span>
          </button>
        </span>
      </label>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
      {state?.success && (
        <p className="form-success" role="status">{state.success}</p>
      )}
    </form>
  );
}
