"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { headers } from "next/headers";
import { canAccessGroup } from "@/lib/auth/access";
import { createEmailChangeToken, readEmailChangeToken } from "@/lib/auth/email-change-token";
import { sendEmailChangeConfirmationEmail } from "@/lib/email/email-change-email";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { confirmGroupLoginEmailChange } from "@/lib/sheets/group-admin";
import { listGroupUsers } from "@/lib/sheets/group-users";
import { requestOrigin } from "@/lib/http/request-origin";

export type EmailChangeActionState = { error?: string; success?: string } | null;

const requestSchema = z.object({
  groupId: z.string().uuid(),
  email: z.string().trim().email("Informe um e-mail válido."),
});

function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

export async function requestResponsibleEmailChangeAction(
  _state: EmailChangeActionState,
  formData: FormData,
): Promise<EmailChangeActionState> {
  const parsed = requestSchema.safeParse({
    groupId: formData.get("groupId"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise o novo e-mail." };
  }

  const current = await requireAuthorizedSessionWithAggregatedAtas();
  if (current.access.role !== "responsavel_grupo" || !canAccessGroup(current.access, parsed.data.groupId)) {
    return { error: "Você não tem autorização para alterar este e-mail." };
  }
  const group = current.result.grupos.find(
    (item) => item.grupo_id === parsed.data.groupId && item.ativo,
  );
  const currentEmail = normalizeEmail(current.access.email);
  if (!group || normalizeEmail(group.email_acesso_grupo) !== currentEmail) {
    return { error: "Não foi possível validar o acesso atual deste grupo." };
  }

  const nextEmail = normalizeEmail(parsed.data.email);
  if (nextEmail === currentEmail) {
    return { error: "Informe um e-mail diferente do endereço atual." };
  }
  if (current.result.grupos.some(
    (item) => item.grupo_id !== group.grupo_id && normalizeEmail(item.email_acesso_grupo) === nextEmail,
  )) {
    return { error: "Este e-mail já está associado a outro grupo." };
  }
  const users = await listGroupUsers();
  if (users.some((row) => row.valid && normalizeEmail(row.data.email) === nextEmail && row.data.grupo_id !== group.grupo_id)) {
    return { error: "Este e-mail já está associado a outro acesso." };
  }

  const token = createEmailChangeToken({
    groupId: group.grupo_id,
    currentEmail,
    nextEmail,
  });
  const origin = requestOrigin(await headers());
  if (!origin) throw new Error("Não foi possível identificar o endereço atual da aplicação.");
  const confirmationUrl = `${origin}/confirmar-email/${encodeURIComponent(token)}`;

  try {
    await sendEmailChangeConfirmationEmail({ to: nextEmail, confirmationUrl });
  } catch (error) {
    console.error("Falha ao enviar confirmação para alteração de e-mail:", error);
    return { error: "Não foi possível enviar a confirmação. Tente novamente mais tarde." };
  }

  return {
    success: `Enviamos uma confirmação para ${nextEmail}. Seu e-mail atual continua ativo até a confirmação.`,
  };
}

export async function confirmResponsibleEmailChangeAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const payload = readEmailChangeToken(token);
  if (!payload) redirect("/login?emailChange=invalid");

  try {
    await confirmGroupLoginEmailChange(
      {
        grupo_id: payload.groupId,
        currentEmail: payload.currentEmail,
        nextEmail: payload.nextEmail,
      },
      undefined,
      { kind: "email_change_confirmation", nonce: payload.nonce },
    );
  } catch (error) {
    console.error("Falha ao confirmar alteração de e-mail:", error);
    redirect(`/confirmar-email/${encodeURIComponent(token)}?error=1`);
  }

  revalidatePath(`/grupos/${payload.groupId}`);
  revalidatePath("/responsavel/atas");
  redirect("/login?emailChange=complete");
}
