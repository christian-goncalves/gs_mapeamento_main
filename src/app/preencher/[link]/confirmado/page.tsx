import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveGroupByAtaLink } from "@/lib/sheets/repository";

export default async function PublicAtaConfirmedPage({
  params,
}: {
  params: Promise<{ link: string }>;
}) {
  const { link } = await params;
  const group = await getActiveGroupByAtaLink(link);
  if (!group) notFound();

  return (
    <main className="login">
      <section className="card">
        <h1>Ata enviada</h1>
        <p className="muted">A ata foi registrada com sucesso.</p>
        <Link className="button-link" href={`/preencher/${link}`}>
          Registrar outra ata
        </Link>
      </section>
    </main>
  );
}
