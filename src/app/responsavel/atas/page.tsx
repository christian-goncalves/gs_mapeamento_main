import Link from "next/link";
import { redirect } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faClockRotateLeft, faPlus } from "@fortawesome/free-solid-svg-icons";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { currentMonthPeriod } from "@/app/admin/atas/admin-atas-data";
import { buildResponsavelAtaRows, nextResponsavelMissingAtaRefreshAt } from "./responsavel-atas-data";
import { ResponsavelAtasTable } from "./responsavel-atas-table";
import { ResponsavelShell } from "../responsavel-shell";
import { AtaApprovalPanel } from "@/app/atas/ata-approval-panel";
import { AtaHistoryRefresh } from "@/app/atas/ata-history-refresh";
import { deriveAtaNumbers } from "@/domain/ata-numbering";

export const dynamic = "force-dynamic";

export default async function ResponsavelAtasPage({
  searchParams,
}: {
  searchParams: Promise<{ historico?: string }>;
}) {
  const { historico } = await searchParams;
  const historyMode = historico === "1";
  const { access, result } = await requireAuthorizedSessionWithAggregatedAtas();
  if (access.role === "administrador") redirect("/admin/grupos");
  const [group] = access.groups;
  if (!group) redirect("/login");

  const now = new Date();
  const rows = buildResponsavelAtaRows({
    group,
    atas: result.atas,
    horarios: result.grupo_horarios,
    now,
  });
  const ataNumbers = deriveAtaNumbers(result.atas);
  const nextMissingAtaRefreshAt = nextResponsavelMissingAtaRefreshAt({
    group,
    atas: result.atas,
    horarios: result.grupo_horarios,
    now,
  });
  const groupAtas = result.atas.filter(
    (item) => item.grupo.grupo_id === group.grupo_id
      && item.registro.ata.status_registro === "ativa",
  );
  const approvalRows = groupAtas
    .filter((item) => item.registro.ata.status_aprovacao === "pendente_revisao")
    .map(({ registro }) => ({
      ataId: registro.ata.ata_id,
      updatedAt: registro.ata.updated_at,
      index: ataNumbers.get(registro.ata.ata_id) ?? 0,
      date: registro.ata.data_reuniao,
      time: registro.ata.hora_inicio,
      group: group.grupo_nome,
    }));
  const period = currentMonthPeriod();
  const historicalDates = rows
    .filter((row) => row.ataId && row.registroStatus !== "ativa")
    .map((row) => row.data)
    .sort();
  const historyStart = historyMode ? historicalDates[0] ?? period.start : period.start;
  const historyEnd = historyMode ? historicalDates.at(-1) ?? period.end : period.end;

  return (
    <ResponsavelShell activeSection="responsavel" settingsHref={`/grupos/${group.grupo_id}`}>
      <AtaHistoryRefresh at={nextMissingAtaRefreshAt} />
      <header className="responsavel-page-header responsavel-atas-page-header">
        <div>
          <p className="eyebrow">Histórico de Atas</p>
          <h1>Grupo {group.grupo_nome}</h1>
        </div>
        <div className="responsavel-page-header-actions">
          <Link
            className="button-link responsavel-history-button"
            href={historyMode ? "/responsavel/atas" : "/responsavel/atas?historico=1"}
            aria-label={historyMode ? "Atas atuais" : "Histórico"}
            title={historyMode ? "Atas atuais" : "Histórico"}
          >
            <span className="button-content">
              <FontAwesomeIcon icon={historyMode ? faArrowLeft : faClockRotateLeft} />
              <span className="responsavel-atas-header-button-label">{historyMode ? "Atas atuais" : "Histórico"}</span>
            </span>
          </Link>
          <Link
            className="button-link responsavel-new-ata-button"
            href="/atas/nova"
            aria-label="Nova Ata"
            title="Nova Ata"
          >
            <span className="button-content">
              <FontAwesomeIcon icon={faPlus} />
              <span className="responsavel-atas-header-button-label">Nova Ata</span>
            </span>
          </Link>
        </div>
      </header>

      <AtaApprovalPanel rows={approvalRows} />

      <ResponsavelAtasTable
        key={historyMode ? "historico" : "atuais"}
        rows={rows}
        historyMode={historyMode}
        groupId={group.grupo_id}
        defaultStartDate={historyStart}
        defaultEndDate={historyEnd}
      />
    </ResponsavelShell>
  );
}
