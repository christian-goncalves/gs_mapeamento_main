"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function signInWithPasswordAction(
  _state: { error: string } | null | undefined,
  formData: FormData,
) {
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
