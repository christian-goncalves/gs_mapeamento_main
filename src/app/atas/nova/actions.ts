"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DuplicateAtaError } from "@/domain/creation";
import { ataSubmissionSchema, type AtaSubmission } from "@/domain/form-schemas";
import {
  hiddenAtaSubmissionSchema,
  normalizeHiddenAtaSubmission,
} from "@/domain/hidden-submission";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { createAtaInSheets } from "@/lib/sheets/create-ata";

export type CreateAtaState = { error?: string };

export async function createAtaAction(
  _previousState: CreateAtaState,
  formData: FormData,
): Promise<CreateAtaState> {
  await requireAuthorizedSession();
  if (formData.get("confirmed") !== "true") {
    return { error: "Confirme o resumo antes de enviar." };
  }
  const payload = formData.get("payload");
  if (typeof payload !== "string") return { error: "Envio inválido." };

  let raw: unknown;
  try {
    raw = JSON.parse(payload);
  } catch {
    return { error: "O resumo enviado não contém JSON válido." };
  }
  const fullResult = ataSubmissionSchema.safeParse(raw);
  let submission: AtaSubmission;
  if (fullResult.success) {
    submission = fullResult.data;
  } else {
    const hiddenResult = hiddenAtaSubmissionSchema.safeParse(raw);
    if (!hiddenResult.success) {
      const issue = hiddenResult.error.issues[0] ?? fullResult.error.issues[0];
      const field = issue.path.join(".");
      return { error: `${field ? `${field}: ` : ""}${issue.message}` };
    }
    submission = normalizeHiddenAtaSubmission(hiddenResult.data);
  }

  let ataId: string;
  try {
    ataId = await createAtaInSheets(submission);
  } catch (error) {
    if (error instanceof DuplicateAtaError) return { error: error.message };
    if (error instanceof Error && /Grupo (inexistente|inativo)/.test(error.message)) {
      return { error: error.message };
    }
    console.error(
      "Falha ao criar ata no Sheets:",
      error instanceof Error ? error.message : "erro desconhecido",
    );
    return { error: "Não foi possível gravar a ata. Nenhuma confirmação foi registrada." };
  }

  revalidatePath("/");
  redirect(`/atas/${ataId}`);
}
