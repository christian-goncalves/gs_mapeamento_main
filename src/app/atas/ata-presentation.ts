import type { AggregatedAta } from "@/domain/aggregate";
import {
  categoriaVisitanteMapping,
  formatoMapping,
  origemContatoMapping,
  plataformaMapping,
  tempoLimpoMapping,
  tipoReuniaoMapping,
} from "@/domain/enums";
import type { AtaReviewLayoutData } from "./ata-review-layout";
import { formatReviewLocation } from "./nova/ata-review";

function cidadeEstado(value: string) {
  const match = value.match(/^(.*)\s+-\s+([A-Z]{2})$/);
  if (!match) return { cidade: value, estado: "-" };
  return { cidade: match[1], estado: match[2] };
}

export type AtaPresentation = {
  ataId: string;
  title: string;
  filename: string;
  groupEmail: string;
  groupActive: boolean;
  groupReference: string;
  sequential: number;
  reviewData: AtaReviewLayoutData;
};

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildAtaPresentation(item: AggregatedAta): AtaPresentation {
  const { grupo, registro, indicadores } = item;
  const { ata } = registro;
  const participacaoBrasil = registro.participacao.filter(
    (entry) => entry.pais === "Brasil",
  );
  const membrosInternacionais = registro.participacao.filter(
    (entry) => entry.pais !== "Brasil",
  );
  const achievements = registro.trocas_chaveiro.flatMap((entry) =>
    Array.from({ length: entry.quantidade }, (_, index) => ({
      id: `${entry.troca_chaveiro_id}-${index}`,
      time: tempoLimpoMapping.toSheet(entry.tempo_limpo),
    })),
  );

  return {
    ataId: ata.ata_id,
    title: `Ata ${ata.indice_personalizado_grupo} - ${grupo.grupo_nome}`,
    filename: `ata-${safeFilename(grupo.grupo_nome)}-${ata.data_reuniao}-${ata.indice_personalizado_grupo}.pdf`,
    groupEmail: grupo.email_acesso_grupo,
    groupActive: grupo.ativo,
    groupReference: String(ata.indice_personalizado_grupo),
    sequential: ata.numero_sequencial_grupo,
    reviewData: {
      group: grupo.grupo_nome,
      date: ata.data_reuniao,
      time: ata.hora_inicio,
      filledBy: ata.preenchido_por,
      platform: plataformaMapping.toSheet(ata.plataforma),
      meetingType: tipoReuniaoMapping.toSheet(ata.tipo_reuniao),
      formats: ata.formatos.map((code) => formatoMapping.toSheet(code)).join(", "),
      membersPresent: ata.total_membros_presentes,
      shares: ata.total_partilhas,
      additionalInformation: [
        ata.duracao ? { label: "Duração", value: ata.duracao } : null,
        ata.formato_outros ? { label: "Formato outros", value: ata.formato_outros } : null,
      ].filter((entry): entry is { label: string; value: string } => entry !== null),
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
      achievements: achievements.map((entry, index) => ({
        id: entry.id,
        label: `Conquista ${index + 1}`,
        time: entry.time,
      })),
      supplementalMetrics: {
        states: indicadores.total_estados,
        countries: indicadores.total_paises,
        membersWithoutLocation: indicadores.membros_sem_localidade,
      },
    },
  };
}
