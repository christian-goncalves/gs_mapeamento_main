import { NextResponse } from "next/server";
import { canAccessGroup } from "@/lib/auth/access";
import { buildMonthlyDashboardData } from "@/app/relatorios/monthly-group-dashboard-data";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { renderMonthlyReportPdf, monthlyReportFilename } from "@/lib/pdf/monthly-report-pdf-document";

export type MonthlyReportContext = Awaited<ReturnType<typeof requireAuthorizedSessionWithAggregatedAtas>>;

export async function monthlyReportPdfResponse(
  context: MonthlyReportContext,
  filters: { groupId: string; month: number; year: number },
  download: boolean,
) {
  const { access, result } = context;
  if (!canAccessGroup(access, filters.groupId)) {
    return NextResponse.json({ error: "Grupo não encontrado ou sem autorização." }, { status: 404 });
  }
  const group = result.grupos.find((item) => item.grupo_id === filters.groupId && item.ativo);
  if (!group) return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });

  const data = buildMonthlyDashboardData(result, {
    grupoId: filters.groupId,
    month: filters.month,
    year: filters.year,
  });
  const profile = access.role === "administrador" ? "admin" : "responsavel";
  const pdf = await renderMonthlyReportPdf(data, profile);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `${download ? "attachment" : "inline"}; filename="${monthlyReportFilename(data)}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
