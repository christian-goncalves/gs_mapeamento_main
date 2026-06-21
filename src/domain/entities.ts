import { z } from "zod";

const requiredText = z.string().trim().min(1);
const uuid = z.string().uuid();
const timestamp = z.string().datetime({ offset: true });

const sheetBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toUpperCase() === "TRUE") return true;
    if (value.toUpperCase() === "FALSE") return false;
  }
  return value;
}, z.boolean());

const sheetInteger = (minimum: number) =>
  z.preprocess((value) => {
    if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
      return Number(value);
    }
    return value;
  }, z.number().int().min(minimum));

const auditFields = {
  created_at: timestamp,
  updated_at: timestamp,
};

export const PLATAFORMAS = ["Zoom"] as const;
export const TIPOS_REUNIAO = ["aberta", "fechada"] as const;
export const CATEGORIAS_VISITANTE = [
  "provavel_adicto",
  "familiar",
  "profissional",
  "estudante",
  "outro",
] as const;
export const ORIGENS_CONTATO = [
  "indicacao_pessoal",
  "familiar",
  "profissional",
  "grupo_na",
  "internet",
  "redes_sociais",
  "radio",
  "tv",
  "material_impresso",
  "evento_palestra",
  "encaminhamento",
  "outro",
] as const;
export const TEMPOS_LIMPO = [
  "30 dias",
  "60 dias",
  "90 dias",
  "6 meses",
  "9 meses",
  "1 ano",
  "18 meses",
  "Múltiplos anos",
] as const;

export const grupoSchema = z.object({
  grupo_id: uuid,
  zoom_id: requiredText,
  grupo_nome: requiredText,
  ordem: sheetInteger(1),
  ativo: sheetBoolean,
  ...auditFields,
});

const horaInicioSchema = z.string().regex(
  /^(?:[01]\d|2[0-3]):(?:00|30)$/,
  "O horário deve usar intervalos de 30 minutos.",
);

export const ataSchema = z
  .object({
    ata_id: uuid,
    grupo_id: uuid,
    data_reuniao: z.string().date(),
    hora_inicio: horaInicioSchema,
    plataforma: z.enum(PLATAFORMAS),
    tipo_reuniao: z.enum(TIPOS_REUNIAO),
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
    { message: "Selecione pelo menos um formato de reunião." },
  );

export const servidorSchema = z.object({
  servidor_id: uuid,
  ata_id: uuid,
  nome: requiredText,
  ordem: sheetInteger(1),
  ...auditFields,
});

export const participacaoSchema = z
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
    if (item.pais.toLocaleLowerCase("pt-BR") === "brasil" && !item.estado) {
      context.addIssue({
        code: "custom",
        path: ["estado"],
        message: "Estado é obrigatório quando o país é Brasil.",
      });
    }
  });

export const visitanteSchema = z.object({
  visitante_id: uuid,
  ata_id: uuid,
  nome: requiredText,
  cidade: requiredText,
  categoria: z.enum(CATEGORIAS_VISITANTE),
  origem_contato: z.enum(ORIGENS_CONTATO),
  ...auditFields,
});

export const trocaChaveiroSchema = z.object({
  troca_chaveiro_id: uuid,
  ata_id: uuid,
  tempo_limpo: z.enum(TEMPOS_LIMPO),
  ...auditFields,
});

export type Grupo = z.infer<typeof grupoSchema>;
export type Ata = z.infer<typeof ataSchema>;
export type Servidor = z.infer<typeof servidorSchema>;
export type Participacao = z.infer<typeof participacaoSchema>;
export type Visitante = z.infer<typeof visitanteSchema>;
export type TrocaChaveiro = z.infer<typeof trocaChaveiroSchema>;
