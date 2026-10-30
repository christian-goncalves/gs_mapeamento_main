import { redirect } from "next/navigation";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { MonthlyGroupDashboard } from "@/app/relatorios/monthly-group-dashboard";
import {
  buildMonthlyDashboardData,
  dashboardYears,
} from "@/app/relatorios/monthly-group-dashboard-data";
import { ResponsavelShell } from "../responsavel-shell";

export const dynamic = "force-dynamic";

type ResponsavelRelatoriosPageProps = {
  searchParams?: Promise<{
    mes?: string | string[];
    ano?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function currentMonth() {
  return Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      month: "2-digit",
    }).format(new Date()),
  );
}

function currentYear() {
  return Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
    }).format(new Date()),
  );
}

function parseMonth(value: string | undefined) {
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12
    ? month
    : currentMonth();
}

function parseYear(value: string | undefined) {
  const year = Number(value);
  return Number.isInteger(year) && year >= 2000 && year <= 2100
    ? year
    : currentYear();
}

export default async function ResponsavelRelatoriosPage({
  searchParams,
}: ResponsavelRelatoriosPageProps) {
  const { access, result } = await requireAuthorizedSessionWithAggregatedAtas();
  if (access.role === "administrador") redirect("/admin/grupos");
  const [group] = access.groups;
  if (!group) redirect("/login");

  const params = await searchParams;

  return (
    <ResponsavelShell activeSection="relatorios" settingsHref={`/grupos/${group.grupo_id}`}>
      <MonthlyGroupDashboard
        data={buildMonthlyDashboardData(result, {
          grupoId: group.grupo_id,
          month: parseMonth(firstParam(params?.mes)),
          year: parseYear(firstParam(params?.ano)),
        })}
        groups={[group]}
        years={dashboardYears(result)}
        showGroupFilter={false}
        showFoundationMeetingCard
        showResponsavelHeader
      />
    </ResponsavelShell>
  );
}
