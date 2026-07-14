"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  formatValidationMessages,
  strongPasswordSchema,
} from "@/lib/auth/password-policy";
import { resetGroupUserPassword } from "@/lib/sheets/group-users";

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

export async function resetPasswordAction(
  _state: { error: string } | null | undefined,
  formData: FormData,
) {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: formatValidationMessages(parsed.error.issues) };
  }
  const user = await resetGroupUserPassword(
    parsed.data.token,
    parsed.data.password,
  );
  if (!user) {
    return { error: "Link inválido ou expirado." };
  }
  redirect("/login");
}
