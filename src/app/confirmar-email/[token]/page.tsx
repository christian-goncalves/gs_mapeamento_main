import Link from "next/link";
import { readEmailChangeToken } from "@/lib/auth/email-change-token";
import { confirmResponsibleEmailChangeAction } from "@/app/grupos/email-change-actions";

export const dynamic = "force-dynamic";

export default async function ConfirmEmailChangePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const [{ token }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as { error?: string }),
  ]);
  const validToken = readEmailChangeToken(token);
  const hasError = query.error === "1";

  return (
    <main className="login">
      <section className="card email-change-confirm-page">
        <h1>Confirmar novo e-mail</h1>
        {validToken ? (
          <>
            {hasError && (
              <p className="form-error" role="alert">
                Não foi possível concluir a alteração. O e-mail atual continua ativo; tente solicitar uma nova confirmação.
              </p>
            )}
            <p className="muted">
              Confirme <strong>{validToken.nextEmail}</strong> como novo e-mail de acesso do GS Mapeamento.
            </p>
            <p className="muted">O endereço atual será substituído após esta confirmação.</p>
            <form action={confirmResponsibleEmailChangeAction}>
              <input type="hidden" name="token" value={token} />
              <button className="full-button" type="submit">Confirmar alteração</button>
            </form>
          </>
        ) : (
          <>
            <p className="form-error" role="alert">Este link de confirmação é inválido ou expirou.</p>
            <p className="login-footer"><Link href="/login">Voltar ao acesso</Link></p>
          </>
        )}
      </section>
    </main>
  );
}
