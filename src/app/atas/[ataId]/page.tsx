import Link from "next/link";
import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faFilePdf, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { canAccessGroup } from "@/lib/auth/access";
import {
  buildAtaPresentation,
} from "../ata-presentation";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import {
  AtaReviewLayout,
} from "../ata-review-layout";
import { getAtaDetailBackHref } from "../nova/ata-review";
import { AtaPdfActions } from "../ata-pdf-actions";
import { getAtaNavigation, type AtaNavigationSearchParams } from "../ata-navigation";

export const dynamic = "force-dynamic";

export default async function AtaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ ataId: string }>;
  searchParams: Promise<AtaNavigationSearchParams>;
}) {
  const { access, result } = await requireAuthorizedSessionWithAggregatedAtas();
  const [{ ataId }, query] = await Promise.all([params, searchParams]);
  const item = result.atas.find(
    (candidate) => candidate.registro.ata.ata_id === ataId,
  );
  if (!item) notFound();
  if (!canAccessGroup(access, item.grupo.grupo_id)) notFound();

  const { grupo, registro } = item;
  const { ata } = registro;
  const presentation = buildAtaPresentation(item, result.atas);
  const navigation = getAtaNavigation({
    currentAtaId: ata.ata_id,
    currentGroupId: grupo.grupo_id,
    atas: result.atas,
    access,
    searchParams: query,
  });
  const origin = Array.isArray(query.origem) ? query.origem[0] : query.origem;
  const backHref = access.role === "responsavel_grupo" && origin === "historico"
    ? "/responsavel/atas?historico=1"
    : getAtaDetailBackHref(access.role);

  return (
    <main className="shell ata-detail-review-shell">
      <nav className="ata-record-navigation" aria-label="Navegação entre atas">
        {navigation.previousId ? (
          <Link className="button-link secondary" href={`/atas/${navigation.previousId}${navigation.query}`}>
            <span className="button-content"><FontAwesomeIcon icon={faArrowLeft} />Ata anterior</span>
          </Link>
        ) : (
          <button className="secondary" type="button" disabled>
            <span className="button-content"><FontAwesomeIcon icon={faArrowLeft} />Ata anterior</span>
          </button>
        )}
        {navigation.nextId ? (
          <Link className="button-link secondary" href={`/atas/${navigation.nextId}${navigation.query}`}>
            <span className="button-content">Próxima ata<FontAwesomeIcon icon={faArrowRight} /></span>
          </Link>
        ) : (
          <button className="secondary" type="button" disabled>
            <span className="button-content">Próxima ata<FontAwesomeIcon icon={faArrowRight} /></span>
          </button>
        )}
      </nav>
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
            {ata.status_registro === "substituida" && <span className="badge">Versão substituída</span>}
            {ata.status_registro === "excluida" && <span className="badge">Ata excluída</span>}
          </>
        )}
        headerAction={(
          <>
            <Link
              className="button-link secondary review-back-link ata-pdf-icon-button"
              href={backHref}
              title="Voltar"
              aria-label="Voltar"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
            {ata.status_registro === "ativa"
              && ["aprovada", "pendente_revisao"].includes(ata.status_aprovacao ?? "aprovada") && (
                <Link
                  className="button-link secondary review-edit-button ata-pdf-icon-button"
                  href={`/atas/${ata.ata_id}/editar`}
                  title="Editar"
                  aria-label="Editar"
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                </Link>
              )}
            <a
              className="button-link secondary review-pdf-button ata-pdf-icon-button"
              href={`/atas/${ata.ata_id}/pdf`}
              target="_blank"
              rel="noreferrer"
              title="Visualizar PDF"
              aria-label="Visualizar PDF"
            >
              <FontAwesomeIcon icon={faFilePdf} />
            </a>
            <AtaPdfActions
              ataId={ata.ata_id}
              title={presentation.title}
              filename={presentation.filename}
              defaultRecipient={presentation.groupEmail}
              showPreview={false}
              iconOnly
            />
          </>
        )}
      />
    </main>
  );
}
