import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const tokenPayloadSchema = z.object({
  purpose: z.literal("responsavel-email-change"),
  groupId: z.string().uuid(),
  currentEmail: z.email(),
  nextEmail: z.email(),
  expiresAt: z.number().int(),
  nonce: z.string().uuid(),
});

export type EmailChangeTokenPayload = z.infer<typeof tokenPayloadSchema>;

function signingSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Variável de ambiente obrigatória ausente: AUTH_SECRET");
  return secret;
}

function signature(body: string) {
  return createHmac("sha256", signingSecret()).update(body).digest("base64url");
}

export function createEmailChangeToken(input: {
  groupId: string;
  currentEmail: string;
  nextEmail: string;
}) {
  const payload: EmailChangeTokenPayload = {
    purpose: "responsavel-email-change",
    groupId: input.groupId,
    currentEmail: input.currentEmail.trim().toLocaleLowerCase("en-US"),
    nextEmail: input.nextEmail.trim().toLocaleLowerCase("en-US"),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    nonce: randomUUID(),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signature(body)}`;
}

export function readEmailChangeToken(token: string): EmailChangeTokenPayload | null {
  const [body, providedSignature, extra] = token.split(".");
  if (!body || !providedSignature || extra) return null;

  try {
    const expectedSignature = Buffer.from(signature(body), "base64url");
    const actualSignature = Buffer.from(providedSignature, "base64url");
    if (
      expectedSignature.length !== actualSignature.length ||
      !timingSafeEqual(expectedSignature, actualSignature)
    ) {
      return null;
    }
    const payload = tokenPayloadSchema.safeParse(
      JSON.parse(Buffer.from(body, "base64url").toString("utf8")),
    );
    if (!payload.success || payload.data.expiresAt <= Date.now()) return null;
    return payload.data;
  } catch {
    return null;
  }
}
