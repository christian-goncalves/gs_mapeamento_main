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
import { AtaPdfActions } from "../ata-pdf-actions";
import { getAtaNavigation, type AtaNavigationSearchParams } from "../ata-navigation";
import { AdminShell } from "@/app/grupos/admin-shell";
import { ResponsavelShell } from "@/app/responsavel/responsavel-shell";

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
  const page = (
    <div className="ata-detail-review-shell">
      <AtaReviewLayout
        className="ata-review-page"
        detailPage
        title={presentation.title}
        titleId="ata-detail-title"
        headingLevel="h1"
        data={presentation.reviewData}
        headerToolbar={(
          <>
            <nav className="ata-record-navigation" aria-label="Navegação entre atas">
              {navigation.previousId ? (
                <Link className="button-link ata-pdf-icon-button" href={`/atas/${navigation.previousId}${navigation.query}`} aria-label="Ata anterior">
                  <FontAwesomeIcon icon={faArrowLeft} />
                </Link>
              ) : (
                <button className="ata-pdf-icon-button" type="button" disabled aria-label="Ata anterior">
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
              )}
              <span className="ata-record-navigation-label">Atas</span>
              {navigation.nextId ? (
                <Link className="button-link ata-pdf-icon-button" href={`/atas/${navigation.nextId}${navigation.query}`} aria-label="Próxima ata">
                  <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              ) : (
                <button className="ata-pdf-icon-button" type="button" disabled aria-label="Próxima ata">
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              )}
            </nav>
            <div className="ata-detail-toolbar-right">
              <div className="ata-detail-toolbar-actions">
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
              </div>
              <div className="ata-detail-toolbar-badges">
                {!grupo.ativo && <span className="badge">Grupo inativo</span>}
                {ata.status_aprovacao === "pendente_revisao" && <span className="badge">Pendente de revisão</span>}
                {ata.status_registro === "substituida" && <span className="badge">Versão substituída</span>}
                {ata.status_registro === "excluida" && <span className="badge">Ata excluída</span>}
              </div>
            </div>
          </>
        )}
      />
    </div>
  );

  return access.role === "responsavel_grupo" ? (
    <ResponsavelShell activeSection="responsavel" settingsHref={`/grupos/${grupo.grupo_id}`}>
      {page}
    </ResponsavelShell>
  ) : (
    <AdminShell activeSection="atas">{page}</AdminShell>
  );
}
