"use client";

import { useActionState } from "react";
import { activateAccessAction } from "../actions";

export function ActivationForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(activateAccessAction, null);

  return (
    <form action={action} className="creation-form">
      <input type="hidden" name="token" value={token} />
      <label>
        Nova senha
        <input name="password" type="password" minLength={8} required />
      </label>
      <label>
        Confirmar senha
        <input name="confirmPassword" type="password" minLength={8} required />
      </label>
      {state?.error && <p className="form-error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        Criar senha
      </button>
    </form>
  );
}
