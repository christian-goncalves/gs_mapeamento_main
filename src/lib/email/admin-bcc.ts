import "server-only";

import { z } from "zod";

function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("en-US");
}

export function adminBccFor(recipient: string) {
  const adminEmail = process.env.EMAIL_ADMIN_BCC?.trim();
  if (!adminEmail) {
    throw new Error("Variável de ambiente obrigatória ausente: EMAIL_ADMIN_BCC");
  }
  if (!z.string().email().safeParse(adminEmail).success) {
    throw new Error("A variável EMAIL_ADMIN_BCC precisa conter um e-mail válido.");
  }

  return normalizeEmail(adminEmail) === normalizeEmail(recipient)
    ? undefined
    : adminEmail;
}
