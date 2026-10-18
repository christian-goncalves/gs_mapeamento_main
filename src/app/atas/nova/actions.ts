"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DuplicateAtaCustomIndexError,
  DuplicateAtaSequenceError,
  InvalidAtaIdentifiersError,
} from "@/domain/ata-identifiers";
import { DuplicateAtaError } from "@/domain/creation";
import { ataSubmissionSchema, type AtaSubmission } from "@/domain/form-schemas";
import {
  hiddenAtaSubmissionSchema,
  normalizeHiddenAtaSubmission,
} from "@/domain/hidden-submission";
import { canAccessGroup } from "@/lib/auth/access";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { createAtaInSheets } from "@/lib/sheets/create-ata";
import { getActiveGroupByAtaLink } from "@/lib/sheets/repository";

export type CreateAtaState = { error?: string };

function parseSubmissionPayload(payload: FormDataEntryValue | null):
  | { ok: true; submission: AtaSubmission }
  | { ok: false; error: string } {
  if (typeof payload !== "string") return { ok: false, error: "Envio inválido." };

  let raw: unknown;
  try {
    raw = JSON.parse(payload);
  } catch {
    return { ok: false, error: "O resumo enviado não contém JSON válido." };
  }
  const fullResult = ataSubmissionSchema.safeParse(raw);
  if (fullResult.success) {
    return { ok: true, submission: fullResult.data };
  }

  const hiddenResult = hiddenAtaSubmissionSchema.safeParse(raw);
  if (!hiddenResult.success) {
    const issue = hiddenResult.error.issues[0] ?? fullResult.error.issues[0];
    const field = issue.path.join(".");
    return {
      ok: false,
      error: `${field ? `${field}: ` : ""}${issue.message}`,
    };
  }
  return {
    ok: true,
    submission: normalizeHiddenAtaSubmission(hiddenResult.data),
  };
}

async function persistSubmission(
  submission: AtaSubmission,
  actorEmail?: string,
  publicLinkToken?: string,
) {
  try {
    return await createAtaInSheets(submission, actorEmail, publicLinkToken);
  } catch (error) {
    if (
      error instanceof DuplicateAtaError ||
      error instanceof DuplicateAtaCustomIndexError ||
      error instanceof DuplicateAtaSequenceError ||
      error instanceof InvalidAtaIdentifiersError
    ) {
      return { error: error.message };
    }
    if (error instanceof Error && /Grupo (inexistente|inativo)/.test(error.message)) {
      return { error: error.message };
    }
    console.error(
      "Falha ao criar ata no Sheets:",
      error instanceof Error ? error.message : "erro desconhecido",
    );
    return { error: "Não foi possível gravar a ata. Nenhuma confirmação foi registrada." };
  }
}

export async function createAtaAction(
  _previousState: CreateAtaState,
  formData: FormData,
): Promise<CreateAtaState> {
  const current = await requireAuthorizedSession();
  if (formData.get("confirmed") !== "true") {
    return { error: "Confirme o resumo antes de enviar." };
  }
  const parsed = parseSubmissionPayload(formData.get("payload"));
  if (!parsed.ok) return { error: parsed.error };
  if (!canAccessGroup(current.access, parsed.submission.ata.grupo_id)) {
    return { error: "Você não tem permissão para enviar uma ata para este grupo." };
  }

  const result = await persistSubmission(parsed.submission, current.access.email);
  if ("error" in result) return result;

  revalidatePath("/");
  redirect(`/atas/${result.ataId}`);
}

export async function createAtaByLinkAction(
  _previousState: CreateAtaState,
  formData: FormData,
): Promise<CreateAtaState> {
  if (formData.get("confirmed") !== "true") {
    return { error: "Confirme o resumo antes de enviar." };
  }
  const link = formData.get("link_formulario_ata");
  if (typeof link !== "string" || !link) {
    return { error: "Link de preenchimento inválido." };
  }
  const group = await getActiveGroupByAtaLink(link);
  if (!group) return { error: "Link de preenchimento inválido ou inativo." };

  const parsed = parseSubmissionPayload(formData.get("payload"));
  if (!parsed.ok) return { error: parsed.error };
  const submission: AtaSubmission = {
    ...parsed.submission,
    ata: {
      ...parsed.submission.ata,
      grupo_id: group.group.grupo_id,
    },
  };
  const result = await persistSubmission(submission, undefined, link);
  if ("error" in result) return result;

  redirect(`/preencher/${link}/confirmado?ataId=${encodeURIComponent(result.ataId)}`);
}
