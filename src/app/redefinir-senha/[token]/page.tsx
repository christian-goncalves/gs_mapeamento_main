import Link from "next/link";
import { getPasswordResetByToken } from "@/lib/sheets/group-users";
import { ResetPasswordForm } from "./reset-password-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getPasswordResetByToken(token);

  return (
    <main className="login">
      <section className="card">
        <h1>Nova senha</h1>
        {user ? (
          <>
            <p className="muted">{user.email}</p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <>
            <p className="form-error">Link inválido ou expirado.</p>
            <p className="login-footer">
              <Link href="/esqueci-senha">Pedir novo link</Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
