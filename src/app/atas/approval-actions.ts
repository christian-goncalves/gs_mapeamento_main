"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { approveAtasInSheets } from "@/lib/sheets/approve-atas";

const approvalSelectionSchema = z.array(z.object({
  ataId: z.string().uuid(),
  updatedAt: z.string().datetime({ offset: true }),
})).min(1).max(50);

export async function approveAtasAction(input: unknown) {
  const { access } = await requireAuthorizedSession();
  const parsed = approvalSelectionSchema.safeParse(input);
  if (!parsed.success) return { error: "A seleção de atas é inválida ou excede o limite de 50." };
  try {
    const result = await approveAtasInSheets(parsed.data, access.email);
    revalidatePath("/admin/atas");
    revalidatePath("/responsavel/atas");
    revalidatePath("/responsavel/relatorios");
    return { approvedIds: result.approvedIds };
  } catch (error) {
    return {
      error: error instanceof Error
        ? error.message
        : "Não foi possível aprovar as atas selecionadas.",
    };
  }
}
