import "server-only";

import { Resend } from "resend";

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
  })[character] ?? character);
}

export async function sendEmailChangeConfirmationEmail({
  to,
  confirmationUrl,
}: {
  to: string;
  confirmationUrl: string;
}) {
  const resend = new Resend(requiredEnvironment("RESEND_API_KEY"));
  const safeUrl = escapeHtml(confirmationUrl);
  const result = await resend.emails.send({
    from: requiredEnvironment("EMAIL_FROM"),
    to,
    subject: "Confirme a alteração do e-mail do GS Mapeamento",
    text: [
      "Recebemos uma solicitação para alterar o e-mail de acesso ao GS Mapeamento.",
      "",
      "Confirme o novo endereço neste link, válido por 24 horas:",
      confirmationUrl,
      "",
      "O endereço atual só será alterado depois da confirmação.",
      "Se você não fez esta solicitação, ignore esta mensagem.",
    ].join("\n"),
    html: `
      <p>Recebemos uma solicitação para alterar o e-mail de acesso ao GS Mapeamento.</p>
      <p><a href="${safeUrl}">Confirmar novo e-mail</a></p>
      <p>O link é válido por 24 horas. O endereço atual só será alterado depois da confirmação.</p>
      <p>Se você não fez esta solicitação, ignore esta mensagem.</p>
    `,
  });

  if (result.error) {
    throw new Error(`Falha ao enviar confirmação de e-mail: ${result.error.message}`);
  }
  return result.data;
}
