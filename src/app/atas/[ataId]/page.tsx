import Link from "next/link";
import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { canAccessGroup } from "@/lib/auth/access";
import {
  categoriaVisitanteMapping,
  formatoMapping,
  origemContatoMapping,
  plataformaMapping,
  tempoLimpoMapping,
  tipoReuniaoMapping,
} from "@/domain/enums";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { readAggregatedAtas } from "@/lib/sheets/repository";
import {
  AtaReviewLayout,
  type AtaReviewLayoutData,
} from "../ata-review-layout";
import {
  formatReviewLocation,
  getAtaDetailBackHref,
} from "../nova/ata-review";
import { AtaIndexForm } from "./ata-index-form";
import { AtaPdfDownloadButton } from "../ata-pdf-download-button";

export const dynamic = "force-dynamic";

function cidadeEstado(value: string) {
  const match = value.match(/^(.*)\s+-\s+([A-Z]{2})$/);
  if (!match) return { cidade: value, estado: "—" };
  return { cidade: match[1], estado: match[2] };
}

export default async function AtaDetailPage({
  params,
}: {
  params: Promise<{ ataId: string }>;
}) {
  const { access } = await requireAuthorizedSession();
  const { ataId } = await params;
  const result = await readAggregatedAtas();
  const item = result.atas.find(
    (candidate) => candidate.registro.ata.ata_id === ataId,
  );
  if (!item) notFound();
  if (!canAccessGroup(access, item.grupo.grupo_id)) notFound();

  const { grupo, registro, indicadores } = item;
  const { ata } = registro;
  const participacaoBrasil = registro.participacao.filter(
    (entry) => entry.pais === "Brasil",
  );
  const membrosInternacionais = registro.participacao.filter(
    (entry) => entry.pais !== "Brasil",
  );
  const conquistasTempo = registro.trocas_chaveiro.flatMap((entry) =>
    Array.from({ length: entry.quantidade }, (_, index) => ({
      id: `${entry.troca_chaveiro_id}-${index}`,
      tempo: tempoLimpoMapping.toSheet(entry.tempo_limpo),
    })),
  );
  const backHref = getAtaDetailBackHref(access.role);
  const additionalInformation = [
    ata.duracao ? { label: "Duração", value: ata.duracao } : null,
    ata.formato_outros
      ? { label: "Formato outros", value: ata.formato_outros }
      : null,
  ].filter((entry): entry is { label: string; value: string } => entry !== null);

  const reviewData: AtaReviewLayoutData = {
    group: grupo.grupo_nome,
    date: ata.data_reuniao,
    time: ata.hora_inicio,
    filledBy: ata.preenchido_por,
    platform: plataformaMapping.toSheet(ata.plataforma),
    meetingType: tipoReuniaoMapping.toSheet(ata.tipo_reuniao),
    formats: ata.formatos.map((code) => formatoMapping.toSheet(code)).join(", "),
    membersPresent: ata.total_membros_presentes,
    shares: ata.total_partilhas,
    additionalInformation,
    servers: registro.servidores.map((entry) => ({
      id: entry.servidor_id,
      name: entry.nome,
      role: entry.funcao,
    })),
    locations: participacaoBrasil.map((entry) => ({
      id: entry.participacao_id,
      name: formatReviewLocation(entry.localidade, entry.estado),
      count: entry.presencas,
    })),
    internationalMembers: membrosInternacionais.map((entry) => ({
      id: entry.participacao_id,
      country: entry.pais,
      count: entry.presencas,
    })),
    visitors: registro.visitantes.map((entry, index) => ({
      id: entry.visitante_id,
      label: `Visitante ${index + 1}`,
      city: entry.cidade,
      category: categoriaVisitanteMapping.toSheet(entry.descricao),
      origin: origemContatoMapping.toSheet(entry.como_chegou_a_na),
    })),
    admissions: registro.ingressos.map((entry, index) => {
      const location = cidadeEstado(entry.cidade);
      return {
        id: entry.ingresso_id,
        label: `Ingresso ${index + 1}`,
        city: location.cidade,
        state: location.estado,
      };
    }),
    achievements: conquistasTempo.map((entry, index) => ({
      id: entry.id,
      label: `Conquista ${index + 1}`,
      time: entry.tempo,
    })),
    supplementalMetrics: {
      states: indicadores.total_estados,
      countries: indicadores.total_paises,
      membersWithoutLocation: indicadores.membros_sem_localidade,
    },
  };

  return (
    <main className="shell ata-detail-review-shell">
      <AtaReviewLayout
        className="ata-review-page"
        title={`Ata ${ata.indice_personalizado_grupo} — ${grupo.grupo_nome}`}
        titleId="ata-detail-title"
        headingLevel="h1"
        data={reviewData}
        headerBadge={!grupo.ativo ? <span className="badge">Grupo inativo</span> : undefined}
        headerAction={(
          <>
            <Link className="button-link secondary review-back-link" href={backHref}>
              <span className="button-content">
                <FontAwesomeIcon icon={faArrowLeft} />
                Voltar
              </span>
            </Link>
            <AtaPdfDownloadButton
              ataId={ata.ata_id}
              className="button-link secondary review-pdf-button"
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
