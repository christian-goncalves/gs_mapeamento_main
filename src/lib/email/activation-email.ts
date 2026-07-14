import "server-only";

import { Resend } from "resend";
import type { Grupo, UsuarioGrupo } from "@/domain/entities";

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

function appUrl() {
  return requiredEnvironment("APP_URL").replace(/\/$/, "");
}

export function activationUrl(token: string) {
  return `${appUrl()}/ativar-acesso/${token}`;
}

export async function sendActivationEmail({
  group,
  user,
}: {
  group: Grupo;
  user: UsuarioGrupo;
}) {
  if (user.status !== "pendente" || !user.convite_token) return null;

  const resend = new Resend(requiredEnvironment("RESEND_API_KEY"));
  const url = activationUrl(user.convite_token);
  const subject = `Ative seu acesso ao GS Mapeamento - ${group.grupo_nome}`;

  const result = await resend.emails.send({
    from: requiredEnvironment("EMAIL_FROM"),
    to: user.email,
    subject,
    text: [
      `Olá${user.nome ? `, ${user.nome}` : ""}.`,
      "",
      `Seu acesso ao grupo ${group.grupo_nome} foi criado no GS Mapeamento.`,
      "Use o link abaixo para criar sua senha:",
      "",
      url,
      "",
      "Se você não solicitou esse acesso, ignore este e-mail.",
    ].join("\n"),
    html: `
      <p>Olá${user.nome ? `, ${user.nome}` : ""}.</p>
      <p>Seu acesso ao grupo <strong>${group.grupo_nome}</strong> foi criado no GS Mapeamento.</p>
      <p><a href="${url}">Criar minha senha</a></p>
      <p>Se o botão não funcionar, copie e cole este link no navegador:</p>
      <p>${url}</p>
      <p>Se você não solicitou esse acesso, ignore este e-mail.</p>
    `,
  });

  if (result.error) {
    throw new Error(`Falha ao enviar e-mail de ativação: ${result.error.message}`);
  }

  return result.data;
}
