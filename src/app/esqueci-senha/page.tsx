import Link from "next/link";
import { PasswordResetRequestForm } from "./password-reset-request-form";

export default function ForgotPasswordPage() {
  return (
    <main className="login">
      <section className="card">
        <h1>Redefinir senha</h1>
        <p className="muted">Informe seu e-mail cadastrado.</p>
        <PasswordResetRequestForm />
        <p className="login-footer">
          <Link href="/login">Voltar para login</Link>
        </p>
      </section>
    </main>
  );
}
