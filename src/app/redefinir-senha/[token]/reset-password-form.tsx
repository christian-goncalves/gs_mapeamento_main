"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "../actions";
import { PasswordVisibilityInput } from "../../password-visibility-input";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null);

  return (
    <form action={action} className="login-form">
      <input name="token" type="hidden" value={token} />
      <label>
        Nova senha
        <PasswordVisibilityInput name="password" minLength={8} required />
      </label>
      <label>
        Confirmar senha
        <PasswordVisibilityInput
          name="confirmPassword"
          minLength={8}
          required
        />
      </label>
      {state?.error && <p className="form-error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        Salvar senha
      </button>
    </form>
  );
}
