import { NextResponse } from "next/server";
import { canAccessGroup } from "@/lib/auth/access";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { deriveAtaNumbers } from "@/domain/ata-numbering";
import { buildAtaPresentation } from "@/app/atas/ata-presentation";
import { friendlyGroupKey } from "@/lib/pdf/friendly-pdf-links";
import { renderAtaPdf } from "@/lib/pdf/ata-pdf-document";

export const dynamic = "force-dynamic";

function isoDateFromPath(value: string) {
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ number: string; date: string; groupKey: string }> },
) {
  const { number: numberValue, date: dateValue, groupKey } = await params;
  const number = Number(numberValue);
  const date = isoDateFromPath(dateValue);
  if (!Number.isInteger(number) || number < 1 || !date) {
    return NextResponse.json({ error: "Ata não encontrada." }, { status: 404 });
  }

  const { access, result } = await requireAuthorizedSessionWithAggregatedAtas();
  const groups = result.grupos.filter((group) => friendlyGroupKey(group.grupo_nome, group.grupo_id) === groupKey);
  const group = groups.length === 1 ? groups[0] : undefined;
  if (!group || !canAccessGroup(access, group.grupo_id)) {
    return NextResponse.json({ error: "Ata não encontrada ou sem autorização." }, { status: 404 });
  }

  const numbers = deriveAtaNumbers(result.atas);
  const candidates = result.atas.filter((item) =>
    item.grupo.grupo_id === group.grupo_id
    && item.registro.ata.data_reuniao === date
    && (item.registro.ata.status_registro ?? "ativa") === "ativa"
    && numbers.get(item.registro.ata.ata_id) === number,
  );
  const item = candidates.length === 1 ? candidates[0] : undefined;
  if (!item) return NextResponse.json({ error: "Ata não encontrada ou sem autorização." }, { status: 404 });

  const presentation = buildAtaPresentation(item, result.atas);
  const bytes = await renderAtaPdf(presentation);
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `${download ? "attachment" : "inline"}; filename="${presentation.filename}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
