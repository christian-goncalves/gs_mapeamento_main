import "server-only";

import { Resend } from "resend";
import type { UsuarioGrupo } from "@/domain/entities";

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

function appUrl() {
  return requiredEnvironment("APP_URL").replace(/\/$/, "");
}

export function passwordResetUrl(token: string) {
  return `${appUrl()}/redefinir-senha/${token}`;
}

export async function sendPasswordResetEmail(user: UsuarioGrupo) {
  if (user.status !== "ativo" || !user.convite_token) return null;

  const resend = new Resend(requiredEnvironment("RESEND_API_KEY"));
  const url = passwordResetUrl(user.convite_token);

  const result = await resend.emails.send({
    from: requiredEnvironment("EMAIL_FROM"),
    to: user.email,
    subject: "Redefinir senha - GS Mapeamento",
    text: [
      `Olá${user.nome ? `, ${user.nome}` : ""}.`,
      "",
      "Use o link abaixo para redefinir sua senha no GS Mapeamento:",
      "",
      url,
      "",
      "Se você não solicitou essa alteração, ignore este e-mail.",
    ].join("\n"),
    html: `
      <p>Olá${user.nome ? `, ${user.nome}` : ""}.</p>
      <p>Use o link abaixo para redefinir sua senha no GS Mapeamento:</p>
      <p><a href="${url}">Redefinir senha</a></p>
      <p>Se o botão não funcionar, copie e cole este link no navegador:</p>
      <p>${url}</p>
      <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
    `,
  });

  if (result.error) {
    throw new Error(`Falha ao enviar e-mail de redefinição: ${result.error.message}`);
  }

  return result.data;
}
