"use client";

import { useActionState } from "react";
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
        Enviar link
      </button>
    </form>
  );
}
