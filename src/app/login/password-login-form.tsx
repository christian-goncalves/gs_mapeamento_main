"use client";

import { useActionState } from "react";
import { signInWithPasswordAction } from "./actions";
import { PasswordVisibilityInput } from "../password-visibility-input";

export function PasswordLoginForm() {
  const [state, action, pending] = useActionState(
    signInWithPasswordAction,
    null,
  );

  return (
    <form action={action} className="login-form">
      <label>
        E-mail
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Senha
        <PasswordVisibilityInput
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state?.error && <p className="form-error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        Entrar
      </button>
    </form>
  );
}
