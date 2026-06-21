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
    data_reuniao: z.string().date(),
    hora_inicio: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/, "Horário inválido."),
    plataforma: z.literal("Zoom"),
    tipo_reuniao: z.enum(["Aberta", "Fechada"]),
    formato_partilha: sheetBoolean,
    formato_estudo: sheetBoolean,
    formato_tematico: sheetBoolean,
    formato_literatura: sheetBoolean,
    formato_passos: sheetBoolean,
    formato_tradicoes: sheetBoolean,
    total_membros_presentes: sheetInteger(0),
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
    "30 dias",
    "60 dias",
    "90 dias",
    "6 meses",
    "9 meses",
    "1 ano",
    "18 meses",
    "Múltiplos anos",
  ]),
  ...auditFields,
});

export type SheetGrupo = z.infer<typeof sheetGrupoSchema>;
export type SheetAta = z.infer<typeof sheetAtaSchema>;
export type SheetServidor = z.infer<typeof sheetServidorSchema>;
export type SheetParticipacao = z.infer<typeof sheetParticipacaoSchema>;
export type SheetVisitante = z.infer<typeof sheetVisitanteSchema>;
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
