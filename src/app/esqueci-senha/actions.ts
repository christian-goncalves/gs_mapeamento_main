"use server";

import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/email/password-reset-email";
import { createPasswordResetForGroupUser } from "@/lib/sheets/group-users";

const resetRequestSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
});

export async function requestPasswordResetAction(
  _state: { error?: string; success?: string } | null | undefined,
  formData: FormData,
) {
  const parsed = resetRequestSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const user = await createPasswordResetForGroupUser(parsed.data.email);
  if (user) await sendPasswordResetEmail(user);

  return {
    success:
      "Se este e-mail estiver cadastrado, enviaremos um link para redefinir a senha.",
  };
}
