"use client";

import { useActionState } from "react";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { requestPasswordResetAction } from "./actions";

export function PasswordResetRequestForm() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    null,
  );

  return (
    <form action={action} className="login-form">
      <label>
        E-mail
        <input name="email" type="email" required />
      </label>
      {state?.error && <p className="form-error">{state.error}</p>}
      {state?.success && <p className="form-success">{state.success}</p>}
      <button type="submit" disabled={pending}>
        <span className="button-content">
          <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
          {pending ? "Enviando…" : "Enviar Link"}
        </span>
      </button>
    </form>
  );
}
