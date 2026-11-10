import { notFound } from "next/navigation";
import { canAccessGroup } from "@/lib/auth/access";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { buildAtaPresentation } from "../../ata-presentation";

export const dynamic = "force-dynamic";

export default async function AtaPdfPreviewPage({
  params,
}: {
  params: Promise<{ ataId: string }>;
}) {
  const { access, result } = await requireAuthorizedSessionWithAggregatedAtas();
  const { ataId } = await params;
  const item = result.atas.find(
    (candidate) => candidate.registro.ata.ata_id === ataId,
  );
  if (!item || !canAccessGroup(access, item.grupo.grupo_id)) notFound();

  const presentation = buildAtaPresentation(item, result.atas);

  return (
    <main className="ata-pdf-preview-shell">
      <section className="ata-pdf-preview-frame" aria-label={`PDF de ${presentation.title}`}>
        <iframe
          src={`/api/atas/${ataId}/pdf`}
          title={`PDF de ${presentation.title}`}
        />
      </section>
    </main>
  );
}
