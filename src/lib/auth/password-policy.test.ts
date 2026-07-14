import { describe, expect, it } from "vitest";
import {
  formatValidationMessages,
  passwordPolicyMessages,
  strongPasswordSchema,
} from "./password-policy";

function issuesFor(password: string) {
  const result = strongPasswordSchema.safeParse(password);
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.message);
}

describe("política de senha forte", () => {
  it("rejeita senha sem letras", () => {
    expect(issuesFor("11111111")).toEqual(
      expect.arrayContaining([
        passwordPolicyMessages.uppercase,
        passwordPolicyMessages.lowercase,
      ]),
    );
  });

  it("rejeita senha sem maiúscula e sem número", () => {
    expect(issuesFor("abcdefgh")).toEqual(
      expect.arrayContaining([
        passwordPolicyMessages.uppercase,
        passwordPolicyMessages.number,
      ]),
    );
  });

  it("rejeita senha sem minúscula e sem número", () => {
    expect(issuesFor("ABCDEFGH")).toEqual(
      expect.arrayContaining([
        passwordPolicyMessages.lowercase,
        passwordPolicyMessages.number,
      ]),
    );
  });

  it("rejeita senha sem número", () => {
    expect(issuesFor("Abcdefgh")).toContain(passwordPolicyMessages.number);
  });

  it("rejeita senha com menos de oito caracteres", () => {
    expect(issuesFor("Abc123")).toContain(passwordPolicyMessages.minLength);
  });

  it("aceita senha com maiúscula, minúscula, número e oito caracteres", () => {
    expect(strongPasswordSchema.safeParse("Abcdefg1").success).toBe(true);
  });

  it("formata mensagens específicas sem duplicar texto", () => {
    const result = strongPasswordSchema.safeParse("11111111");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatValidationMessages(result.error.issues)).toBe(
        [
          passwordPolicyMessages.uppercase,
          passwordPolicyMessages.lowercase,
        ].join(" "),
      );
    }
  });
});
