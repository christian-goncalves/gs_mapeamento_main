"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ZodError, z } from "zod";
import {
  DuplicateAtaCustomIndexError,
  DuplicateAtaSequenceError,
  InvalidAtaIdentifiersError,
} from "@/domain/ata-identifiers";
import { AtaPlatformResolutionError } from "@/domain/ata-platform";
import { DuplicateAtaError } from "@/domain/creation";
import { ataSubmissionSchema, type AtaSubmission } from "@/domain/form-schemas";
import { SheetsOperationError } from "@/domain/sheets-operation-error";
import {
  hiddenAtaSubmissionSchema,
  normalizeHiddenAtaSubmission,
} from "@/domain/hidden-submission";
import { canAccessGroup } from "@/lib/auth/access";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { createAtaInSheets } from "@/lib/sheets/create-ata";
import { getActiveGroupByAtaLink, listActiveAtaKeys } from "@/lib/sheets/repository";

export type CreateAtaState = { error?: string };

const ataAvailabilitySchema = z.object({
  grupo_id: z.string().uuid(),
  data_reuniao: z.string().date(),
  link_formulario_ata: z.string().optional(),
  ignorar_ata_id: z.string().uuid().optional(),
});

export async function checkAtaAvailabilityAction(input: unknown) {
  const parsed = ataAvailabilitySchema.safeParse(input);
  if (!parsed.success) return { error: "Informe grupo e data válidos." };

  if (parsed.data.link_formulario_ata) {
    const group = await getActiveGroupByAtaLink(parsed.data.link_formulario_ata);
    if (!group || group.group.grupo_id !== parsed.data.grupo_id) {
      return { error: "O link de preenchimento não corresponde ao grupo selecionado." };
    }
  } else {
    const current = await requireAuthorizedSession();
    if (!canAccessGroup(current.access, parsed.data.grupo_id)) {
      return { error: "Você não tem permissão para consultar este grupo." };
    }
  }

  try {
    const activeAtaKeys = await listActiveAtaKeys();
    const occupiedTimes = activeAtaKeys.flatMap((key) =>
      key.ata_id !== parsed.data.ignorar_ata_id &&
      key.grupo_id === parsed.data.grupo_id &&
      key.data_reuniao === parsed.data.data_reuniao
        ? [key.hora_inicio]
        : [],
    );
    return { occupiedTimes: [...new Set(occupiedTimes)] };
  } catch {
    return { error: "Não foi possível verificar a disponibilidade agora. Tente novamente." };
  }
}

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
  context: "autenticado" | "publico",
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
    if (error instanceof AtaPlatformResolutionError) {
      return { error: error.message };
    }
    if (error instanceof Error && /Grupo (inexistente|inativo)/.test(error.message)) {
      return { error: error.message };
    }
    if (error instanceof ZodError) {
      const issues = error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
      const details = issues.map((issue) => issue.message).filter(Boolean).join(" ");
      const correlationId = globalThis.crypto.randomUUID();
      console.error(JSON.stringify({
        event: "ata_submission_validation_failure",
        correlationId,
        context,
        issues,
      }));
      return { error: details ? `Os dados da ata não passaram na validação: ${details}` : "Os dados da ata não passaram na validação. Revise os campos e tente novamente." };
    }
    const correlationId = globalThis.crypto.randomUUID();
    const requestId = (await headers()).get("x-vercel-id");
    if (error instanceof SheetsOperationError) {
      console.error(JSON.stringify({
        event: "ata_submission_sheets_failure",
        correlationId,
        requestId,
        context,
        operation: error.operation,
        errorName: error.cause instanceof Error ? error.cause.name : "UnknownError",
      }));
      return error.operation === "read"
        ? { error: "Não foi possível consultar os dados necessários no Sheets. Nenhuma gravação foi iniciada; tente novamente." }
        : { error: "Não foi possível confirmar a gravação da ata. Confira se ela aparece no histórico antes de tentar novamente." };
    }
    console.error(JSON.stringify({
      event: "ata_submission_failure",
      correlationId,
      requestId,
      context,
      errorName: error instanceof Error ? error.name : "UnknownError",
    }));
    return { error: `O envio foi interrompido por uma falha inesperada. Código de atendimento: ${correlationId}.` };
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

  const result = await persistSubmission("autenticado", parsed.submission, current.access.email);
  if ("error" in result) return result;

  revalidatePath("/");
  revalidatePath("/responsavel/atas");
  redirect("/responsavel/atas");
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
  const result = await persistSubmission("publico", submission, undefined, link);
  if ("error" in result) return result;

  redirect(`/preencher/${link}/confirmado?ataId=${encodeURIComponent(result.ataId)}`);
}
