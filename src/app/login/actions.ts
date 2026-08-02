"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { isEmailAllowed } from "@/lib/auth/allowed-emails";

export async function signInWithPasswordAction(
  _state: { error: string } | null | undefined,
  formData: FormData,
) {
  const email = formData.get("email");
  if (typeof email === "string" && isEmailAllowed(email.trim())) {
    return { error: "Administradores devem entrar com Google." };
  }
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }
    throw error;
  }
  return null;
}
