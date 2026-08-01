import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { canAccessGroup } from "@/lib/auth/access";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { readAggregatedAtas } from "@/lib/sheets/repository";
import {
  categoriaVisitanteMapping,
  formatoMapping,
  origemContatoMapping,
  plataformaMapping,
  tempoLimpoMapping,
  tipoReuniaoMapping,
} from "@/domain/enums";

export const dynamic = "force-dynamic";

function safeFilename(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function wrap(text: string, max = 88) {
  const safeText = text.replace(/[^\x20-\x7e\xa0-\xff]/g, "-");
  const words = safeText.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (!line || `${line} ${word}`.length <= max) line = line ? `${line} ${word}` : word;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ataId: string }> },
) {
  const { access } = await requireAuthorizedSession();
  const { ataId } = await params;
  const result = await readAggregatedAtas();
  const item = result.atas.find((candidate) => candidate.registro.ata.ata_id === ataId);
  if (!item || !canAccessGroup(access, item.grupo.grupo_id)) {
    return NextResponse.json({ error: "Ata não encontrada ou sem autorização." }, { status: 404 });
  }

  const { grupo, registro } = item;
  const { ata } = registro;
  const formats = ata.formatos.map((code) => formatoMapping.toSheet(code)).join(", ");
  const sections: Array<[string, string[]]> = [
    ["Informações gerais", [
      `Grupo: ${grupo.grupo_nome}`,
      `Data e hora: ${ata.data_reuniao.split("-").reverse().join("/")} às ${ata.hora_inicio}`,
      `Preenchido por: ${ata.preenchido_por}`,
      `Plataforma: ${plataformaMapping.toSheet(ata.plataforma)}`,
      `Tipo: ${tipoReuniaoMapping.toSheet(ata.tipo_reuniao)}`,
      `Formatos: ${formats}`,
      `Membros presentes: ${ata.total_membros_presentes}`,
      `Partilhas: ${ata.total_partilhas}`,
    ]],
    ["Servidores", registro.servidores.map((entry) => `${entry.ordem}. ${entry.nome}${entry.funcao ? ` — ${entry.funcao}` : ""}`)],
    ["Participação", registro.participacao.map((entry) => `${entry.pais === "Brasil" ? `${entry.localidade} - ${entry.estado}` : entry.pais}: ${entry.presencas}`)],
    ["Visitantes", registro.visitantes.map((entry, index) => `Visitante ${index + 1}: ${entry.cidade}; ${categoriaVisitanteMapping.toSheet(entry.descricao)}; ${origemContatoMapping.toSheet(entry.como_chegou_a_na)}`)],
    ["Ingressos", registro.ingressos.map((entry, index) => `Ingresso ${index + 1}: ${entry.cidade}`)],
    ["Conquistas de tempo", registro.trocas_chaveiro.map((entry) => `${tempoLimpoMapping.toSheet(entry.tempo_limpo)}: ${entry.quantidade}`)],
  ];

  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  let page = document.addPage([595.28, 841.89]);
  let y = 790;
  const draw = (text: string, size = 10, isBold = false, color = rgb(.08, .16, .12)) => {
    for (const line of wrap(text, size >= 16 ? 58 : 88)) {
      if (y < 55) { page = document.addPage([595.28, 841.89]); y = 790; }
      page.drawText(line, { x: 48, y, size, font: isBold ? bold : regular, color });
      y -= size + 5;
    }
  };

  draw(`Ata ${ata.indice_personalizado_grupo} — ${grupo.grupo_nome}`, 18, true, rgb(0, .38, .25));
  draw(`ID: ${ata.ata_id}`, 8);
  draw(`Gerado em: ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date())}`, 8);
  y -= 8;
  for (const [title, rows] of sections) {
    draw(title, 13, true, rgb(0, .38, .25));
    if (!rows.length) draw("Nenhum registro.", 10);
    else rows.forEach((row) => draw(row, 10));
    y -= 8;
  }

  const bytes = await document.save();
  const filename = `ata-${safeFilename(grupo.grupo_nome)}-${ata.data_reuniao}-${ata.indice_personalizado_grupo}.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, no-store",
    },
  });
}
