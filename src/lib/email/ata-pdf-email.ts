import "server-only";

import { Resend } from "resend";
import type { AtaPresentation } from "@/app/atas/ata-presentation";

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendAtaPdfEmail({
  presentation,
  recipient,
  requestId,
  pdf,
}: {
  presentation: AtaPresentation;
  recipient: string;
  requestId: string;
  pdf: Buffer;
}) {
  const resend = new Resend(requiredEnvironment("RESEND_API_KEY"));
  const date = presentation.reviewData.date.split("-").reverse().join("/");
  const subject = `${presentation.title} - ${date}`;
  const safeTitle = escapeHtml(presentation.title);

  const result = await resend.emails.send({
    from: requiredEnvironment("EMAIL_FROM"),
    to: recipient,
    subject,
    text: [
      `${presentation.title}`,
      "",
      `Segue em anexo o PDF da ata confirmada de ${date}, às ${presentation.reviewData.time}.`,
      "",
      "Mensagem enviada pelo GS Mapeamento.",
    ].join("\n"),
    html: `
      <p><strong>${safeTitle}</strong></p>
      <p>Segue em anexo o PDF da ata confirmada de ${date}, às ${escapeHtml(presentation.reviewData.time)}.</p>
      <p>Mensagem enviada pelo GS Mapeamento.</p>
    `,
    attachments: [{
      content: pdf,
      filename: presentation.filename,
    }],
    tags: [
      { name: "feature", value: "ata_pdf" },
      { name: "ata_id", value: presentation.ataId },
    ],
  }, { idempotencyKey: `ata-pdf/${presentation.ataId}/${requestId}` });

  if (result.error) {
    throw new Error(`Falha ao enviar PDF da ata: ${result.error.message}`);
  }

  return result.data;
}
