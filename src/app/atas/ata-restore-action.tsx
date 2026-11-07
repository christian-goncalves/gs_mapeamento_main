"use client";

import { useActionState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { restoreAtaAction } from "./lifecycle-actions";

export function AtaRestoreAction({
  ataId,
  updatedAt,
}: {
  ataId: string;
  updatedAt: string;
}) {
  const [state, action, pending] = useActionState(restoreAtaAction, {});

  return (
    <form action={action}>
      <input type="hidden" name="ata_id" value={ataId} />
      <input type="hidden" name="updated_at" value={updatedAt} />
      <button
        type="submit"
        className="responsavel-action-menu-item"
        role="menuitem"
        disabled={pending}
      >
        <FontAwesomeIcon icon={faRotateLeft} />
        <span>{pending ? "Restaurando..." : "Restaurar"}</span>
      </button>
      {state.error && <small role="alert">{state.error}</small>}
    </form>
  );
}
