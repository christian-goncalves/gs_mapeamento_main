import "server-only";

import { Resend } from "resend";
import type { Grupo, UsuarioGrupo } from "@/domain/entities";

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

export async function sendNewUserNotificationEmail({
  group,
  user,
}: {
  group: Grupo;
  user: UsuarioGrupo;
}) {
  const resend = new Resend(requiredEnvironment("RESEND_API_KEY"));
  const recipient = requiredEnvironment("NEW_USER_NOTIFICATION_EMAIL");
  const subject = "Novo usuário cadastrado no GS Mapeamento";
  const safeGroupName = escapeHtml(group.grupo_nome);
  const safeUserEmail = escapeHtml(user.email);
  const safeUserName = user.nome ? escapeHtml(user.nome) : "";
  const text = [
    "Um novo acesso foi cadastrado no GS Mapeamento.",
    "",
    `Grupo: ${group.grupo_nome}`,
    `E-mail: ${user.email}`,
    user.nome ? `Responsável: ${user.nome}` : "",
  ].filter(Boolean).join("\n");

  const result = await resend.emails.send({
    from: requiredEnvironment("EMAIL_FROM"),
    to: recipient,
    subject,
    text,
    html: `
      <p>Um novo acesso foi cadastrado no GS Mapeamento.</p>
      <p><strong>Grupo:</strong> ${safeGroupName}</p>
      <p><strong>E-mail:</strong> ${safeUserEmail}</p>
      ${safeUserName ? `<p><strong>Responsável:</strong> ${safeUserName}</p>` : ""}
    `,
  });

  if (result.error) {
    throw new Error(`Falha ao notificar novo usuário: ${result.error.message}`);
  }

  return result.data;
}
