import { z } from "zod";
import type { ZodIssue } from "zod";

export const passwordPolicyMessages = {
  minLength: "A senha deve ter pelo menos 8 caracteres.",
  uppercase: "A senha deve ter pelo menos uma letra maiúscula.",
  lowercase: "A senha deve ter pelo menos uma letra minúscula.",
  number: "A senha deve ter pelo menos um número.",
};

export const strongPasswordSchema = z
  .string()
  .min(8, passwordPolicyMessages.minLength)
  .regex(/[A-Z]/, passwordPolicyMessages.uppercase)
  .regex(/[a-z]/, passwordPolicyMessages.lowercase)
  .regex(/[0-9]/, passwordPolicyMessages.number);

export function formatValidationMessages(issues: ZodIssue[]) {
  return Array.from(new Set(issues.map((issue) => issue.message))).join(" ");
}
