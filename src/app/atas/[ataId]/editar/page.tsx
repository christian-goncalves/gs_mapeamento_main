import Link from "next/link";
import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import type { AggregatedAta } from "@/domain/aggregate";
import type { HiddenAtaSubmission } from "@/domain/hidden-submission";
import { canAccessGroup } from "@/lib/auth/access";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { formatReviewLocation } from "@/app/atas/nova/ata-review";
import { AtaForm } from "@/app/atas/nova/ata-form";
import { reviseAtaAction } from "@/app/atas/lifecycle-actions";

export const dynamic = "force-dynamic";

function hiddenSubmission(item: AggregatedAta): HiddenAtaSubmission {
  const { ata, servidores, participacao, visitantes, ingressos, trocas_chaveiro } = item.registro;
  return {
    ata: {
      grupo_id: ata.grupo_id,
      data_reuniao: ata.data_reuniao,
      hora_inicio: ata.hora_inicio,
      duracao: ata.duracao,
      formato_outros: ata.formato_outros,
      preenchido_por: ata.preenchido_por,
      plataforma: ata.plataforma,
      tipo_reuniao: ata.tipo_reuniao,
      formatos: ata.formatos,
      total_membros_presentes: ata.total_membros_presentes,
      total_partilhas: ata.total_partilhas,
    },
    servidores: servidores.map(({ nome, funcao }) => ({ nome, funcao })),
    participacao: participacao
      .filter((row) => row.pais === "Brasil")
      .map((row) => ({ localidade: formatReviewLocation(row.localidade, row.estado), presencas: row.presencas })),
    membros_internacionais: participacao
      .filter((row) => row.pais !== "Brasil")
      .map((row) => ({ pais: row.pais, presencas: row.presencas })),
    visitantes: visitantes.map(({ cidade, descricao, como_chegou_a_na }) => ({
      cidade,
      descricao,
      como_chegou_a_na,
    })),
    ingressos: ingressos.map(({ cidade }) => ({ cidade })),
    trocas_chaveiro: trocas_chaveiro.map(({ tempo_limpo, quantidade }) => ({ tempo_limpo, quantidade })),
  };
}

export default async function EditAtaPage({
  params,
}: {
  params: Promise<{ ataId: string }>;
}) {
  const { access, result } = await requireAuthorizedSessionWithAggregatedAtas();
  const { ataId } = await params;
  const item = result.atas.find((candidate) => candidate.registro.ata.ata_id === ataId);
  if (!item || !canAccessGroup(access, item.grupo.grupo_id)) notFound();
  const { ata } = item.registro;
  if (ata.status_registro !== "ativa" || !["aprovada", "pendente_revisao"].includes(ata.status_aprovacao ?? "aprovada")) {
    notFound();
  }

  return (
    <main className="shell ata-detail-review-shell">
      <header className="responsavel-page-header ata-new-page-header">
        <div>
          <p className="eyebrow">Editar ata</p>
          <h1>Grupo {item.grupo.grupo_nome}</h1>
          <p className="muted">
            A edição cria uma nova versão e preserva esta ata no histórico.
            {ata.status_aprovacao === "pendente_revisao" && " A nova versão continuará pendente de aprovação."}
          </p>
        </div>
        <Link className="button-link" href={`/atas/${ata.ata_id}`}>
          <span className="button-content">
            <FontAwesomeIcon icon={faArrowLeft} />
            Cancelar e Voltar à Ata
          </span>
        </Link>
      </header>
      <AtaForm
        groups={[{
          id: item.grupo.grupo_id,
          name: item.grupo.grupo_nome,
          plataforma: item.grupo.plataforma,
          fuso_horario: item.grupo.fuso_horario,
          plataformas: result.grupo_plataformas.filter((platform) => platform.grupo_id === item.grupo.grupo_id && platform.ativo).map((platform) => platform.tipo),
          funcoesServidor: (result.grupo_funcoes_servidor ?? [])
            .filter((funcao) => funcao.grupo_id === item.grupo.grupo_id && funcao.ativo)
            .map((funcao) => funcao.nome),
          horarios: result.grupo_horarios
            .filter((horario) => horario.grupo_id === item.grupo.grupo_id && horario.ativo)
            .map((horario) => ({ dia_semana: horario.dia_semana, hora_inicio: horario.hora_inicio, link_reuniao: horario.link_reuniao, plataformaTipo: result.grupo_plataformas.find((platform) => platform.plataforma_id === horario.plataforma_id && platform.ativo)?.tipo })),
        }]}
        fixedGroupId={item.grupo.grupo_id}
        today={ata.data_reuniao}
        action={reviseAtaAction}
        initialSubmission={hiddenSubmission(item)}
        revision={{
          ataId: ata.ata_id,
          updatedAt: ata.updated_at,
          approvalStatus: ata.status_aprovacao ?? "aprovada",
        }}
      />
    </main>
  );
}
