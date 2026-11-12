import "server-only";

import { Resend } from "resend";
import type { MonthlyDashboardData } from "@/app/relatorios/monthly-group-dashboard-data";
import { monthlyReportFilename } from "@/lib/pdf/monthly-report-pdf-document";
import { adminBccFor } from "@/lib/email/admin-bcc";

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

export async function sendMonthlyReportPdfEmail({
  data,
  recipient,
  requestId,
  pdf,
}: {
  data: MonthlyDashboardData;
  recipient: string;
  requestId: string;
  pdf: Buffer;
}) {
  const resend = new Resend(requiredEnvironment("RESEND_API_KEY"));
  const period = `${String(data.filters.month).padStart(2, "0")}/${data.filters.year}`;
  const subject = `Relatório mensal - ${data.group.grupo_nome} - ${period}`;
  const result = await resend.emails.send({
    from: requiredEnvironment("EMAIL_FROM"),
    to: recipient,
    bcc: adminBccFor(recipient),
    subject,
    text: [
      subject,
      "",
      `Segue em anexo o relatório mensal de ${data.group.grupo_nome} referente a ${period}.`,
      "",
      "Mensagem enviada pelo GS Mapeamento.",
    ].join("\n"),
    html: `<p><strong>${subject.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</strong></p><p>Segue em anexo o relatório mensal do grupo referente ao período selecionado.</p><p>Mensagem enviada pelo GS Mapeamento.</p>`,
    attachments: [{ content: pdf, filename: monthlyReportFilename(data) }],
    tags: [
      { name: "feature", value: "monthly_report_pdf" },
      { name: "group_id", value: data.group.grupo_id },
    ],
  }, { idempotencyKey: `monthly-report-pdf/${data.group.grupo_id}/${period}/${requestId}` });
  if (result.error) throw new Error(`Falha ao enviar relatório mensal: ${result.error.message}`);
  return result.data;
}
