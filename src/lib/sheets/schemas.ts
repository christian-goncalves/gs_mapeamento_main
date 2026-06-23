import { z } from "zod";
import {
  categoriaVisitanteMapping,
  origemContatoMapping,
  plataformaMapping,
  tempoLimpoMapping,
  tipoReuniaoMapping,
} from "@/domain/enums";
import type {
  Ata,
  Grupo,
  Ingresso,
  Participacao,
  Servidor,
  TrocaChaveiro,
  Visitante,
} from "@/domain/schemas";
import { isMunicipioOption } from "@/domain/municipios";

const requiredText = z.string().trim().min(1, "Campo obrigatório.");
const uuid = z.string().uuid("UUID inválido.");
const timestamp = z.string().datetime({ offset: true });
const auditFields = { created_at: timestamp, updated_at: timestamp };

const sheetBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string" && value.toUpperCase() === "TRUE") return true;
  if (typeof value === "string" && value.toUpperCase() === "FALSE") return false;
  return value;
}, z.boolean());

const sheetInteger = (minimum: number) =>
  z.preprocess((value) => {
    if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
      return Number(value);
    }
    return value;
  }, z.number().int().min(minimum));

const sheetDate = z.preprocess((value) => {
  if (typeof value === "number") {
    const milliseconds = Math.round((value - 25569) * 86_400_000);
    return new Date(milliseconds).toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return value;
}, z.string().date());

const sheetTime = z.preprocess((value) => {
  if (typeof value === "number" && value >= 0 && value < 1) {
    const minutes = Math.round(value * 24 * 60);
    const hours = Math.floor(minutes / 60) % 24;
    return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  }
  return value;
}, z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/, "Horário inválido."));

export const sheetAtaBusinessKeySchema = z.object({
  grupo_id: uuid,
  data_reuniao: sheetDate,
  hora_inicio: sheetTime,
});

export const sheetGrupoSchema = z.object({
  grupo_id: uuid,
  zoom_id: requiredText,
  grupo_nome: requiredText,
  ordem: sheetInteger(1),
  ativo: sheetBoolean,
  ...auditFields,
});

export const sheetAtaSchema = z
  .object({
    ata_id: uuid,
    grupo_id: uuid,
    data_reuniao: sheetDate,
    hora_inicio: sheetTime,
    plataforma: z.literal("Zoom"),
    tipo_reuniao: z.enum(["Aberta", "Fechada"]),
    formato_partilha: sheetBoolean,
    formato_estudo: sheetBoolean,
    formato_tematico: sheetBoolean,
    formato_literatura: sheetBoolean,
    formato_passos: sheetBoolean,
    formato_tradicoes: sheetBoolean,
    total_membros_presentes: sheetInteger(1),
    total_partilhas: sheetInteger(1),
    ...auditFields,
  })
  .refine(
    (ata) =>
      ata.formato_partilha ||
      ata.formato_estudo ||
      ata.formato_tematico ||
      ata.formato_literatura ||
      ata.formato_passos ||
      ata.formato_tradicoes,
    { path: ["formatos"], message: "Selecione pelo menos um formato." },
  );

export const sheetServidorSchema = z.object({
  servidor_id: uuid,
  ata_id: uuid,
  nome: requiredText,
  ordem: sheetInteger(1),
  ...auditFields,
});

export const sheetParticipacaoSchema = z
  .object({
    participacao_id: uuid,
    ata_id: uuid,
    localidade: requiredText,
    estado: z.string().trim(),
    pais: requiredText,
    presencas: sheetInteger(1),
    ...auditFields,
  })
  .superRefine((item, context) => {
    const brasil = item.pais === "Brasil";
    if (brasil === Boolean(item.estado)) return;
    context.addIssue({
      code: "custom",
      path: ["estado"],
      message: brasil
        ? "Estado é obrigatório quando o país é Brasil."
        : "Estado deve ficar vazio quando o país não é Brasil.",
    });
  });

export const sheetVisitanteSchema = z.object({
  visitante_id: uuid,
  ata_id: uuid,
  nome: requiredText,
  cidade: requiredText.refine(isMunicipioOption, "Município inexistente."),
  categoria: z.enum([
    "Provável adicto",
    "Familiar",
    "Profissional",
    "Estudante",
    "Outro",
  ]),
  origem_contato: z.enum([
    "Indicação pessoal",
    "Familiar",
    "Profissional",
    "Grupo de NA",
    "Internet",
    "Redes sociais",
    "Rádio",
    "TV",
    "Material impresso",
    "Evento/Palestra",
    "Encaminhamento",
    "Outro",
  ]),
  ...auditFields,
});

export const sheetTrocaChaveiroSchema = z.object({
  troca_chaveiro_id: uuid,
  ata_id: uuid,
  tempo_limpo: z.enum([
    "1M",
    "2M",
    "3M",
    "6M",
    "9M",
    "12M",
    "18M",
    "MULTIPLOS_ANOS",
  ]),
  quantidade: sheetInteger(1),
  ...auditFields,
});

export const sheetIngressoSchema = z.object({
  ingresso_id: uuid,
  ata_id: uuid,
  nome: requiredText,
  cidade: requiredText.refine(isMunicipioOption, "Município inexistente."),
  ...auditFields,
});

export type SheetGrupo = z.infer<typeof sheetGrupoSchema>;
export type SheetAta = z.infer<typeof sheetAtaSchema>;
export type SheetServidor = z.infer<typeof sheetServidorSchema>;
export type SheetParticipacao = z.infer<typeof sheetParticipacaoSchema>;
export type SheetVisitante = z.infer<typeof sheetVisitanteSchema>;
export type SheetIngresso = z.infer<typeof sheetIngressoSchema>;
export type SheetTrocaChaveiro = z.infer<typeof sheetTrocaChaveiroSchema>;

export const sheetGrupoToDomain = (row: SheetGrupo): Grupo => row;
export const domainGrupoToSheet = (item: Grupo): SheetGrupo => item;

export function sheetAtaToDomain(row: SheetAta): Ata {
  const formatos: Ata["formatos"] = [];
  if (row.formato_partilha) formatos.push("partilha");
  if (row.formato_estudo) formatos.push("estudo");
  if (row.formato_tematico) formatos.push("tematico");
  if (row.formato_literatura) formatos.push("literatura");
  if (row.formato_passos) formatos.push("passos");
  if (row.formato_tradicoes) formatos.push("tradicoes");
  return {
    ata_id: row.ata_id,
    grupo_id: row.grupo_id,
    data_reuniao: row.data_reuniao,
    hora_inicio: row.hora_inicio,
    plataforma: plataformaMapping.fromSheet(row.plataforma),
    tipo_reuniao: tipoReuniaoMapping.fromSheet(row.tipo_reuniao),
    formatos,
    total_membros_presentes: row.total_membros_presentes,
    total_partilhas: row.total_partilhas,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function domainAtaToSheet(item: Ata): SheetAta {
  const formatos = new Set(item.formatos);
  return {
    ata_id: item.ata_id,
    grupo_id: item.grupo_id,
    data_reuniao: item.data_reuniao,
    hora_inicio: item.hora_inicio,
    plataforma: plataformaMapping.toSheet(item.plataforma),
    tipo_reuniao: tipoReuniaoMapping.toSheet(item.tipo_reuniao),
    formato_partilha: formatos.has("partilha"),
    formato_estudo: formatos.has("estudo"),
    formato_tematico: formatos.has("tematico"),
    formato_literatura: formatos.has("literatura"),
    formato_passos: formatos.has("passos"),
    formato_tradicoes: formatos.has("tradicoes"),
    total_membros_presentes: item.total_membros_presentes,
    total_partilhas: item.total_partilhas,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export const sheetServidorToDomain = (row: SheetServidor): Servidor => row;
export const domainServidorToSheet = (item: Servidor): SheetServidor => item;
export const sheetParticipacaoToDomain = (
  row: SheetParticipacao,
): Participacao => row;
export const domainParticipacaoToSheet = (
  item: Participacao,
): SheetParticipacao => item;

export function sheetVisitanteToDomain(row: SheetVisitante): Visitante {
  return {
    ...row,
    categoria: categoriaVisitanteMapping.fromSheet(row.categoria),
    origem_contato: origemContatoMapping.fromSheet(row.origem_contato),
  };
}

export function domainVisitanteToSheet(item: Visitante): SheetVisitante {
  return {
    ...item,
    categoria: categoriaVisitanteMapping.toSheet(item.categoria),
    origem_contato: origemContatoMapping.toSheet(item.origem_contato),
  };
}

export const sheetIngressoToDomain = (row: SheetIngresso): Ingresso => row;
export const domainIngressoToSheet = (item: Ingresso): SheetIngresso => item;

export function sheetTrocaChaveiroToDomain(
  row: SheetTrocaChaveiro,
): TrocaChaveiro {
  return {
    ...row,
    tempo_limpo: tempoLimpoMapping.fromSheet(row.tempo_limpo),
  };
}

export function domainTrocaChaveiroToSheet(
  item: TrocaChaveiro,
): SheetTrocaChaveiro {
  return {
    ...item,
    tempo_limpo: tempoLimpoMapping.toSheet(item.tempo_limpo),
  };
}
