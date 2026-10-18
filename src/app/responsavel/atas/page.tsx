import Link from "next/link";
import { redirect } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { ResponsavelAtasTable, type ResponsavelAtaRow } from "./responsavel-atas-table";
import { ResponsavelShell } from "../responsavel-shell";
import { AtaApprovalPanel } from "@/app/atas/ata-approval-panel";

export const dynamic = "force-dynamic";

function primaryServerName(servers: { nome: string; ordem: number }[]) {
  return [...servers].sort((first, second) => first.ordem - second.ordem)[0]?.nome ?? "";
}

export default async function ResponsavelAtasPage() {
  const { access, result } = await requireAuthorizedSessionWithAggregatedAtas();
  if (access.role === "administrador") redirect("/admin/grupos");
  const [group] = access.groups;
  if (!group) redirect("/login");

  const groupAtas = result.atas.filter(
    (item) => item.grupo.grupo_id === group.grupo_id && item.registro.ata.status_registro === "ativa",
  );
  const rows: ResponsavelAtaRow[] = groupAtas.map((item) => {
    const { ata } = item.registro;
    return {
      ataId: ata.ata_id,
      indicePersonalizadoGrupo: ata.indice_personalizado_grupo,
      data: ata.data_reuniao,
      horario: ata.hora_inicio,
      servidor: primaryServerName(item.registro.servidores),
      status: ata.status_aprovacao === "pendente_revisao" ? "Pendente de revisão" : "Enviada",
    };
  });
  const approvalRows = groupAtas
    .filter((item) => item.registro.ata.status_aprovacao === "pendente_revisao")
    .map(({ registro }) => ({
      ataId: registro.ata.ata_id,
      updatedAt: registro.ata.updated_at,
      index: registro.ata.indice_personalizado_grupo,
      date: registro.ata.data_reuniao,
      time: registro.ata.hora_inicio,
      group: group.grupo_nome,
    }));

  return (
    <ResponsavelShell activeSection="responsavel" settingsHref={`/grupos/${group.grupo_id}`}>
      <header className="responsavel-page-header">
        <div>
          <p className="eyebrow">Responsável</p>
          <h1>GRUPO {group.grupo_nome.toLocaleUpperCase("pt-BR")}</h1>
        </div>
        <Link className="button-link responsavel-new-ata-button" href="/atas/nova">
          <span className="button-content">
            <FontAwesomeIcon icon={faPlus} />
            Nova Ata
          </span>
        </Link>
      </header>

      <AtaApprovalPanel rows={approvalRows} />

      <ResponsavelAtasTable rows={rows} />
    </ResponsavelShell>
  );
}
