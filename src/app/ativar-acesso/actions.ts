"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  formatValidationMessages,
  strongPasswordSchema,
} from "@/lib/auth/password-policy";
import { activateGroupUser } from "@/lib/sheets/group-users";

const activationSchema = z
  .object({
    token: z.string().trim().min(1),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

export async function activateAccessAction(
  _state: { error: string } | null | undefined,
  formData: FormData,
) {
  const parsed = activationSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: formatValidationMessages(parsed.error.issues) };
  }
  const user = await activateGroupUser(parsed.data.token, parsed.data.password);
  if (!user) {
    return { error: "Convite inválido ou expirado." };
  }
  redirect("/login");
}
