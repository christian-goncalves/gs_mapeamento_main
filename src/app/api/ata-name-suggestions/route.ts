import { NextResponse } from "next/server";
import { z } from "zod";
import { getAtaNameSuggestionsByGroup } from "@/lib/ata-name-suggestions.server";
import { listRecentServerNamesByGroup } from "@/lib/sheets/repository";

const querySchema = z.object({
  grupo_id: z.string().uuid(),
});

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "grupo_id inválido." },
      { status: 400 },
    );
  }

  const suggestions = await getAtaNameSuggestionsByGroup(parsed.data.grupo_id);
  let servidores = suggestions.servidores;
  try {
    servidores = await listRecentServerNamesByGroup(parsed.data.grupo_id);
  } catch {
    // O campo permanece livre; o cache local é apenas um fallback de sugestões.
  }
  return NextResponse.json({ suggestions: { ...suggestions, servidores } });
}
