import "server-only";

import { Resend } from "resend";
import { adminBccFor } from "@/lib/email/admin-bcc";

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

function formatMeetingDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export async function sendAtaSubmissionNotificationEmail({
  ataId,
  groupName,
  recipient,
  meetingDate,
  filename,
  pdf,
}: {
  ataId: string;
  groupName: string;
  recipient: string;
  meetingDate: string;
  filename: string;
  pdf: Buffer;
}) {
  if (!recipient.trim()) return null;

  const date = formatMeetingDate(meetingDate);
  const resend = new Resend(requiredEnvironment("RESEND_API_KEY"));
  const result = await resend.emails.send({
    from: requiredEnvironment("EMAIL_FROM"),
    to: recipient,
    bcc: adminBccFor(recipient),
    subject: `Ata preenchida em ${date} - ${groupName}`,
    text: [
      `Olá, ${groupName}.`,
      "",
      `A ata da reunião do dia ${date} foi preenchida e enviada pelo GS Mapeamento.`,
    ].join("\n"),
    html: `<p>Olá, ${escapeHtml(groupName)}.</p><p>A ata da reunião do dia <strong>${date}</strong> foi preenchida e enviada pelo GS Mapeamento. O PDF da ata está anexado a esta mensagem.</p>`,
    attachments: [{ content: pdf, filename }],
    tags: [
      { name: "feature", value: "ata_submission_confirmation" },
      { name: "ata_id", value: ataId },
    ],
  }, { idempotencyKey: `ata-submission/${ataId}` });

  if (result.error) {
    throw new Error(`Falha ao enviar aviso de preenchimento da ata: ${result.error.message}`);
  }

  return result.data;
}
