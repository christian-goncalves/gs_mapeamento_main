import { requireAdminSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { AdminShell } from "@/app/grupos/admin-shell";
import { MonthlyGroupDashboard } from "@/app/relatorios/monthly-group-dashboard";
import {
  buildMonthlyDashboardData,
  dashboardYears,
} from "@/app/relatorios/monthly-group-dashboard-data";

export const dynamic = "force-dynamic";

type AdminRelatoriosPageProps = {
  searchParams?: Promise<{
    grupo?: string | string[];
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

export default async function AdminRelatoriosPage({
  searchParams,
}: AdminRelatoriosPageProps) {
  const { result } = await requireAdminSessionWithAggregatedAtas();
  const params = await searchParams;
  const groups = result.grupos
    .filter((group) => group.ativo)
    .sort((first, second) =>
      first.grupo_nome.localeCompare(second.grupo_nome, "pt-BR"),
    );
  const selectedGroup =
    groups.find((group) => group.grupo_id === firstParam(params?.grupo)) ??
    groups[0];

  return (
    <AdminShell activeSection="relatorios">
      {!selectedGroup ? (
        <section className="card">
          <p className="empty-state">Nenhum grupo ativo disponível.</p>
        </section>
      ) : (
        <MonthlyGroupDashboard
          data={buildMonthlyDashboardData(result, {
            grupoId: selectedGroup.grupo_id,
            month: parseMonth(firstParam(params?.mes)),
            year: parseYear(firstParam(params?.ano)),
          })}
          groups={groups}
          years={dashboardYears(result)}
          showGroupFilter
        />
      )}
    </AdminShell>
  );
}
