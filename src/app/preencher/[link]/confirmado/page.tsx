import { notFound } from "next/navigation";
import { getActiveGroupByAtaLink, listAtas } from "@/lib/sheets/repository";
import { PublicAtaConfirmationActions } from "./public-ata-confirmation-actions";

export default async function PublicAtaConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ link: string }>;
  searchParams?: Promise<{ ataId?: string }>;
}) {
  const { link } = await params;
  const group = await getActiveGroupByAtaLink(link);
  if (!group) notFound();
  const ataId = (await searchParams)?.ataId;
  const createdAta = ataId
    ? (await listAtas()).find(
        (row) => row.valid && row.data.ata_id === ataId && row.data.grupo_id === group.group.grupo_id && row.data.status_registro === "ativa",
      )
    : undefined;
  const pending = createdAta?.valid && createdAta.data.status_aprovacao === "pendente_revisao";
  const approved = createdAta?.valid && createdAta.data.status_aprovacao === "aprovada";

  return (
    <main className="login">
      <section className="card">
        <h1>{pending ? "Ata pendente de revisão" : approved ? "Ata enviada" : "Ata registrada"}</h1>
        <p className="muted">
          {pending
            ? "A ata foi registrada e aguarda aprovação do responsável. Ela ainda não entra nos indicadores."
            : approved
              ? "A ata foi registrada com sucesso."
              : "O registro foi recebido. O responsável poderá confirmar o estado no histórico do grupo."}
        </p>
        <PublicAtaConfirmationActions link={link} />
      </section>
    </main>
  );
}
