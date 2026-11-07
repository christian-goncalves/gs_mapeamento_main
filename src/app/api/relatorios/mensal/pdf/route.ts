import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccessGroup } from "@/lib/auth/access";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { buildMonthlyDashboardData } from "@/app/relatorios/monthly-group-dashboard-data";
import { renderMonthlyReportPdf, monthlyReportFilename } from "@/lib/pdf/monthly-report-pdf-document";
import { sendMonthlyReportPdfEmail } from "@/lib/email/monthly-report-pdf-email";

export const dynamic = "force-dynamic";

const emailSchema = z.object({
  grupo: z.string().uuid(),
  mes: z.coerce.number().int().min(1).max(12),
  ano: z.coerce.number().int().min(2000).max(2100),
  recipient: z.string().trim().email("Informe um e-mail válido."),
  requestId: z.string().uuid("Requisição inválida."),
});

function filtersFromSearch(search: URLSearchParams) {
  const grupoId = search.get("grupo") ?? "";
  const month = Number(search.get("mes"));
  const year = Number(search.get("ano"));
  if (!z.string().uuid().safeParse(grupoId).success || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) return null;
  return { grupoId, month, year };
}

export async function GET(request: Request) {
  const { access, result } = await requireAuthorizedSessionWithAggregatedAtas();
  const filters = filtersFromSearch(new URL(request.url).searchParams);
  if (!filters || !canAccessGroup(access, filters.grupoId)) {
    return NextResponse.json({ error: "Grupo ou período inválido." }, { status: 404 });
  }
  const group = result.grupos.find((item) => item.grupo_id === filters.grupoId && item.ativo);
  if (!group) return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });
  const data = buildMonthlyDashboardData(result, filters);
  const profile = access.role === "administrador" ? "admin" : "responsavel";
  const pdf = await renderMonthlyReportPdf(data, profile);
  const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `${disposition}; filename="${monthlyReportFilename(data)}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  const { access, result } = await requireAuthorizedSessionWithAggregatedAtas();
  const payload = await request.json().catch(() => null);
  const parsed = emailSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const { grupo: grupoId, mes: month, ano: year, recipient, requestId } = parsed.data;
  if (!canAccessGroup(access, grupoId)) return NextResponse.json({ error: "Grupo não encontrado ou sem autorização." }, { status: 404 });
  const group = result.grupos.find((item) => item.grupo_id === grupoId && item.ativo);
  if (!group) return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });
  try {
    const data = buildMonthlyDashboardData(result, { grupoId, month, year });
    const profile = access.role === "administrador" ? "admin" : "responsavel";
    const pdf = await renderMonthlyReportPdf(data, profile);
    await sendMonthlyReportPdfEmail({ data, recipient, requestId, pdf });
    return NextResponse.json({ message: "Relatório mensal enviado por e-mail." });
  } catch (error) {
    console.error("Falha ao enviar PDF do relatório mensal.", error);
    return NextResponse.json({ error: "Não foi possível enviar o PDF. Tente novamente." }, { status: 502 });
  }
}
