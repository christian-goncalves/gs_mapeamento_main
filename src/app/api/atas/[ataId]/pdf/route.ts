import { NextResponse } from "next/server";
import { buildAtaPresentation } from "@/app/atas/ata-presentation";
import { canAccessGroup } from "@/lib/auth/access";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { renderAtaPdf } from "@/lib/pdf/ata-pdf-document";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ataId: string }> },
) {
  const { access, result } = await requireAuthorizedSessionWithAggregatedAtas();
  const { ataId } = await params;
  const item = result.atas.find(
    (candidate) => candidate.registro.ata.ata_id === ataId,
  );
  if (!item || !canAccessGroup(access, item.grupo.grupo_id)) {
    return NextResponse.json(
      { error: "Ata não encontrada ou sem autorização." },
      { status: 404 },
    );
  }

  const presentation = buildAtaPresentation(item);
  const bytes = await renderAtaPdf(presentation);
  const disposition = new URL(request.url).searchParams.get("download") === "1"
    ? "attachment"
    : "inline";

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `${disposition}; filename="${presentation.filename}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
