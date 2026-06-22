import Link from "next/link";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { listActiveGroups } from "@/lib/sheets/repository";
import { AtaForm } from "./ata-form";

export const dynamic = "force-dynamic";

export default async function NewAtaPage() {
  await requireAuthorizedSession();
  const groups = await listActiveGroups();
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return (
    <main className="shell form-shell">
      <Link className="back-link" href="/">Voltar para atas</Link>
      <header>
        <p className="eyebrow">Nova ata</p>
        <h1>Registrar reunião</h1>
        <p className="muted">O envio será imutável após a confirmação.</p>
      </header>
      {groups.length === 0 ? (
        <section className="card"><p>Nenhum grupo ativo disponível.</p></section>
      ) : (
        <AtaForm
          groups={groups.map((group) => ({
            id: group.grupo_id,
            name: group.grupo_nome,
          }))}
          today={today}
        />
      )}
    </main>
  );
}
