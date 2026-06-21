import { z } from "zod";
import {
  categoriaVisitanteMapping,
  formatoMapping,
  origemContatoMapping,
  plataformaMapping,
  tempoLimpoMapping,
  tipoReuniaoMapping,
} from "./enums";
import { horaInicioSchema } from "./schemas";
import { isMunicipioOption } from "./municipios";

const requiredText = z.string().trim().min(1, "Campo obrigatório.");

export const grupoFormSchema = z.object({
  zoom_id: requiredText,
  grupo_nome: requiredText,
  ordem: z.number().int().min(1),
  ativo: z.boolean(),
});

export const ataFormSchema = z.object({
  grupo_id: z.string().uuid(),
  data_reuniao: z.string().date(),
  hora_inicio: horaInicioSchema,
  plataforma: z.enum(plataformaMapping.codes),
  tipo_reuniao: z.enum(tipoReuniaoMapping.codes),
  formatos: z.array(z.enum(formatoMapping.codes)).min(1),
  total_membros_presentes: z.number().int().min(0),
});

export const servidorFormSchema = z.object({
  nome: requiredText,
  ordem: z.number().int().min(1),
});

export const participacaoFormSchema = z
  .object({
    localidade: requiredText,
    estado: z.string().trim(),
    pais: requiredText,
    presencas: z.number().int().min(1),
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

export const visitanteFormSchema = z.object({
  nome: requiredText,
  cidade: requiredText.refine(isMunicipioOption, "Município inexistente."),
  categoria: z.enum(categoriaVisitanteMapping.codes),
  origem_contato: z.enum(origemContatoMapping.codes),
});

export const trocaChaveiroFormSchema = z.object({
  tempo_limpo: z.enum(tempoLimpoMapping.codes),
});
