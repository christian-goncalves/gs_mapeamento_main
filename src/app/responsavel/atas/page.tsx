import Link from "next/link";
import { redirect } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { currentMonthPeriod } from "@/app/admin/atas/admin-atas-data";
import { buildResponsavelAtaRows } from "./responsavel-atas-data";
import { ResponsavelAtasTable } from "./responsavel-atas-table";
import { ResponsavelShell } from "../responsavel-shell";
import { AtaApprovalPanel } from "@/app/atas/ata-approval-panel";

export const dynamic = "force-dynamic";

export default async function ResponsavelAtasPage() {
  const { access, result } = await requireAuthorizedSessionWithAggregatedAtas();
  if (access.role === "administrador") redirect("/admin/grupos");
  const [group] = access.groups;
  if (!group) redirect("/login");

  const rows = buildResponsavelAtaRows({
    group,
    atas: result.atas,
    horarios: result.grupo_horarios,
  });
  const groupAtas = result.atas.filter(
    (item) => item.grupo.grupo_id === group.grupo_id && item.registro.ata.status_registro === "ativa",
  );
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
  const period = currentMonthPeriod();

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

      <ResponsavelAtasTable
        rows={rows}
        defaultStartDate={period.start}
        defaultEndDate={period.end}
      />
    </ResponsavelShell>
  );
}
