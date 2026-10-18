"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ataSubmissionSchema, type AtaSubmission } from "@/domain/form-schemas";
import {
  hiddenAtaSubmissionSchema,
  normalizeHiddenAtaSubmission,
} from "@/domain/hidden-submission";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { deleteAtaInSheets, reviseAtaInSheets } from "@/lib/sheets/ata-lifecycle";

export type AtaLifecycleActionState = { error?: string };

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseSubmission(value: FormDataEntryValue | null):
  | { ok: true; submission: AtaSubmission }
  | { ok: false; error: string } {
  if (typeof value !== "string") return { ok: false, error: "Envio inválido." };
  let raw: unknown;
  try {
    raw = JSON.parse(value);
  } catch {
    return { ok: false, error: "O resumo enviado não contém JSON válido." };
  }
  const parsed = ataSubmissionSchema.safeParse(raw);
  if (parsed.success) return { ok: true, submission: parsed.data };
  const hidden = hiddenAtaSubmissionSchema.safeParse(raw);
  if (!hidden.success) {
    const issue = hidden.error.issues[0] ?? parsed.error.issues[0];
    return {
      ok: false,
      error: `${issue.path.join(".") ? `${issue.path.join(".")}: ` : ""}${issue.message}`,
    };
  }
  return { ok: true, submission: normalizeHiddenAtaSubmission(hidden.data) };
}

function refreshAtaViews(ataId: string, relatedAtaId?: string) {
  revalidatePath("/");
  revalidatePath(`/atas/${ataId}`);
  if (relatedAtaId) revalidatePath(`/atas/${relatedAtaId}`);
  revalidatePath("/admin/atas");
  revalidatePath("/admin/relatorios");
  revalidatePath("/responsavel/atas");
  revalidatePath("/responsavel/relatorios");
}

export async function reviseAtaAction(
  _state: AtaLifecycleActionState,
  formData: FormData,
): Promise<AtaLifecycleActionState> {
  const current = await requireAuthorizedSession();
  if (field(formData, "confirmed") !== "true") {
    return { error: "Confirme o resumo da revisão antes de salvar." };
  }
  const parsed = parseSubmission(formData.get("payload"));
  if (!parsed.ok) return { error: parsed.error };
  const ataId = field(formData, "ata_id");
  const updatedAt = field(formData, "updated_at");
  const motivo = field(formData, "motivo_alteracao");
  const metadata = z.object({
    ataId: z.string().uuid(),
    updatedAt: z.string().datetime({ offset: true }),
    motivo: z.string().trim().min(1, "Informe o motivo da alteração.").max(1000),
  }).safeParse({ ataId, updatedAt, motivo });
  if (!metadata.success) return { error: metadata.error.issues[0]?.message ?? "Dados da revisão inválidos." };

  let result: Awaited<ReturnType<typeof reviseAtaInSheets>>;
  try {
    result = await reviseAtaInSheets({
      ataId: metadata.data.ataId,
      expectedUpdatedAt: metadata.data.updatedAt,
      motivo: metadata.data.motivo,
      submission: parsed.submission,
      actorEmail: current.access.email,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar a revisão." };
  }
  refreshAtaViews(result.ataId, metadata.data.ataId);
  redirect(`/atas/${result.ataId}`);
}

export async function deleteAtaAction(
  _state: AtaLifecycleActionState,
  formData: FormData,
): Promise<AtaLifecycleActionState> {
  const current = await requireAuthorizedSession();
  if (field(formData, "confirmed") !== "true") {
    return { error: "Confirme a exclusão para continuar." };
  }
  const metadata = z.object({
    ataId: z.string().uuid(),
    updatedAt: z.string().datetime({ offset: true }),
    motivo: z.string().trim().min(1, "Informe o motivo da exclusão.").max(1000),
  }).safeParse({
    ataId: field(formData, "ata_id"),
    updatedAt: field(formData, "updated_at"),
    motivo: field(formData, "motivo_alteracao"),
  });
  if (!metadata.success) return { error: metadata.error.issues[0]?.message ?? "Dados da exclusão inválidos." };

  try {
    await deleteAtaInSheets({
      ataId: metadata.data.ataId,
      expectedUpdatedAt: metadata.data.updatedAt,
      motivo: metadata.data.motivo,
      actorEmail: current.access.email,
    });
    refreshAtaViews(metadata.data.ataId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível excluir a ata." };
  }
  redirect("/responsavel/atas?historico=1");
}
