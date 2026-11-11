import { NextResponse } from "next/server";
import { friendlyGroupKey } from "@/lib/pdf/friendly-pdf-links";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { monthlyReportPdfResponse } from "@/lib/pdf/monthly-report-pdf-response";

export async function friendlyMonthlyReportResponse({
  groupKey,
  monthValue,
  yearValue,
  download,
}: {
  groupKey: string;
  monthValue: string;
  yearValue: string;
  download: boolean;
}) {
  const context = await requireAuthorizedSessionWithAggregatedAtas();
  const { result } = context;
  const month = Number(monthValue);
  const year = Number(yearValue);
  const groups = result.grupos.filter((group) =>
    group.ativo && friendlyGroupKey(group.grupo_nome, group.grupo_id) === groupKey,
  );
  const group = groups.length === 1 ? groups[0] : undefined;
  if (!group || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Grupo ou período inválido." }, { status: 404 });
  }
  return monthlyReportPdfResponse(context, { groupId: group.grupo_id, month, year }, download);
}
