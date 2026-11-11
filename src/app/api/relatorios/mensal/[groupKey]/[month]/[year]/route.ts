import { friendlyMonthlyReportResponse } from "@/lib/pdf/friendly-monthly-report-response";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupKey: string; month: string; year: string }> },
) {
  const { groupKey, month, year } = await params;
  return friendlyMonthlyReportResponse({
    groupKey,
    monthValue: month,
    yearValue: year,
    download: new URL(request.url).searchParams.get("download") === "1",
  });
}
