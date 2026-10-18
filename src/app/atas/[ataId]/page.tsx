import Link from "next/link";
import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { canAccessGroup } from "@/lib/auth/access";
import {
  buildAtaPresentation,
} from "../ata-presentation";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import {
  AtaReviewLayout,
} from "../ata-review-layout";
import { getAtaDetailBackHref } from "../nova/ata-review";
import { AtaIndexForm } from "./ata-index-form";
import { AtaPdfActions } from "../ata-pdf-actions";

export const dynamic = "force-dynamic";

export default async function AtaDetailPage({
  params,
}: {
  params: Promise<{ ataId: string }>;
}) {
  const { access, result } = await requireAuthorizedSessionWithAggregatedAtas();
  const { ataId } = await params;
  const item = result.atas.find(
    (candidate) => candidate.registro.ata.ata_id === ataId,
  );
  if (!item) notFound();
  if (!canAccessGroup(access, item.grupo.grupo_id)) notFound();

  const { grupo, registro } = item;
  const { ata } = registro;
  const presentation = buildAtaPresentation(item);
  const backHref = getAtaDetailBackHref(access.role);

  return (
    <main className="shell ata-detail-review-shell">
      <AtaReviewLayout
        className="ata-review-page"
        title={presentation.title}
        titleId="ata-detail-title"
        headingLevel="h1"
        data={presentation.reviewData}
        headerBadge={(
          <>
            {!grupo.ativo && <span className="badge">Grupo inativo</span>}
            {ata.status_aprovacao === "pendente_revisao" && <span className="badge">Pendente de revisão</span>}
          </>
        )}
        headerAction={(
          <>
            <Link className="button-link secondary review-back-link" href={backHref}>
              <span className="button-content">
                <FontAwesomeIcon icon={faArrowLeft} />
                Voltar
              </span>
            </Link>
            <AtaPdfActions
              ataId={ata.ata_id}
              title={presentation.title}
              filename={presentation.filename}
              defaultRecipient={presentation.groupEmail}
            />
          </>
        )}
        identification={{
          groupReference: String(ata.indice_personalizado_grupo),
          sequential: ata.numero_sequencial_grupo,
          internalId: ata.ata_id,
          editor: (
            <AtaIndexForm
              ataId={ata.ata_id}
              currentIndex={ata.indice_personalizado_grupo}
            />
          ),
        }}
      />
    </main>
  );
}
