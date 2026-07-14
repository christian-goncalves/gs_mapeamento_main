import { notFound } from "next/navigation";
import Link from "next/link";
import { getPendingActivationByToken } from "@/lib/sheets/group-users";
import { readAggregatedAtas } from "@/lib/sheets/repository";
import { ActivationForm } from "./activation-form";

export const dynamic = "force-dynamic";

export default async function ActivateAccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getPendingActivationByToken(token);
  if (!user) {
    return (
      <main className="login">
        <section className="card">
          <h1>Ativar acesso</h1>
          <p className="form-error">Convite inválido, expirado ou já utilizado.</p>
          <p className="login-footer">
            <Link href="/login">Voltar para login</Link>
          </p>
        </section>
      </main>
    );
  }
  const result = await readAggregatedAtas();
  const group = result.grupos.find((item) => item.grupo_id === user.grupo_id);
  if (!group) notFound();

  return (
    <main className="login">
      <section className="card">
        <h1>Ativar acesso</h1>
        <p className="muted">{group.grupo_nome}</p>
        <p>{user.email}</p>
        <ActivationForm token={token} />
      </section>
    </main>
  );
}
