"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DuplicateAtaCustomIndexError } from "@/domain/ata-identifiers";
import { canAccessGroup } from "@/lib/auth/access";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { updateAtaCustomGroupIndex } from "@/lib/sheets/ata-admin";
import { readAggregatedAtas } from "@/lib/sheets/repository";

export type UpdateAtaIndexState = {
  error?: string;
  success?: string;
} | null;

const updateAtaIndexSchema = z.object({
  ata_id: z.string().uuid("Ata inválida."),
  indice_personalizado_grupo: z.coerce
    .number({ error: "Informe um índice personalizado positivo." })
    .int("Informe um índice personalizado inteiro.")
    .min(1, "Informe um índice personalizado positivo."),
});

function formText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateAtaIndexAction(
  _state: UpdateAtaIndexState,
  formData: FormData,
): Promise<UpdateAtaIndexState> {
  const current = await requireAuthorizedSession();
  const parsed = updateAtaIndexSchema.safeParse({
    ata_id: formText(formData, "ata_id"),
    indice_personalizado_grupo: formText(
      formData,
      "indice_personalizado_grupo",
    ),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const result = await readAggregatedAtas();
  const item = result.atas.find(
    (candidate) =>
      candidate.registro.ata.ata_id === parsed.data.ata_id,
  );
  if (!item || !canAccessGroup(current.access, item.grupo.grupo_id)) {
    return { error: "Ata não encontrada ou sem permissão de edição." };
  }

  try {
    await updateAtaCustomGroupIndex(
      parsed.data.ata_id,
      parsed.data.indice_personalizado_grupo,
    );
  } catch (error) {
    if (error instanceof DuplicateAtaCustomIndexError) {
      return { error: error.message };
    }
    if (error instanceof Error) return { error: error.message };
    return { error: "Não foi possível atualizar o índice da ata." };
  }

  revalidatePath(`/atas/${parsed.data.ata_id}`);
  revalidatePath("/admin/atas");
  revalidatePath("/responsavel/atas");
  return { success: "Índice personalizado atualizado." };
}
