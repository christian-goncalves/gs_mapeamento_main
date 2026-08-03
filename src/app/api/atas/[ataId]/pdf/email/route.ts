import { NextResponse } from "next/server";
import { z } from "zod";
import { buildAtaPresentation } from "@/app/atas/ata-presentation";
import { canAccessGroup } from "@/lib/auth/access";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { sendAtaPdfEmail } from "@/lib/email/ata-pdf-email";
import { renderAtaPdf } from "@/lib/pdf/ata-pdf-document";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  recipient: z.string().trim().email("Informe um e-mail válido."),
  requestId: z.string().uuid("Requisição inválida."),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ataId: string }> },
) {
  const { access, result } = await requireAuthorizedSessionWithAggregatedAtas();
  const payload = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

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

  try {
    const presentation = buildAtaPresentation(item);
    const pdf = await renderAtaPdf(presentation);
    await sendAtaPdfEmail({
      presentation,
      recipient: parsed.data.recipient,
      requestId: parsed.data.requestId,
      pdf,
    });
    return NextResponse.json({ message: "PDF enviado por e-mail." });
  } catch (error) {
    console.error("Falha ao enviar PDF da ata.", error);
    return NextResponse.json(
      { error: "Não foi possível enviar o PDF. Tente novamente." },
      { status: 502 },
    );
  }
}
