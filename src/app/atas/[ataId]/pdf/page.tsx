import Link from "next/link";
import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faDownload } from "@fortawesome/free-solid-svg-icons";
import { canAccessGroup } from "@/lib/auth/access";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { AtaPdfActions } from "../../ata-pdf-actions";
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
    <main className="shell ata-pdf-preview-shell">
      <header className="ata-pdf-preview-header" aria-label="Ações do PDF">
        <div className="ata-pdf-preview-actions">
          <Link
            className="button-link secondary ata-pdf-icon-button"
            href={`/atas/${ataId}`}
            title="Voltar"
            aria-label="Voltar"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </Link>
          <a
            className="button-link secondary ata-pdf-icon-button"
            href={`/api/atas/${ataId}/pdf?download=1`}
            title="Baixar"
            aria-label="Baixar"
          >
            <FontAwesomeIcon icon={faDownload} />
          </a>
          <AtaPdfActions
            ataId={ataId}
            title={presentation.title}
            filename={presentation.filename}
            defaultRecipient={presentation.groupEmail}
            showPreview={false}
            iconOnly
          />
        </div>
      </header>

      <section className="ata-pdf-preview-frame" aria-label={`PDF de ${presentation.title}`}>
        <iframe
          src={`/api/atas/${ataId}/pdf`}
          title={`PDF de ${presentation.title}`}
        />
      </section>
    </main>
  );
}
