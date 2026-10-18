import { z } from "zod";
import {
  categoriaVisitanteMapping,
  origemContatoMapping,
  tempoLimpoMapping,
} from "./enums";
import { ataFormSchema, type AtaSubmission } from "./form-schemas";
import { isMunicipioOption } from "./municipios";

const requiredText = z.string().trim().min(1, "Campo obrigatório.");

const optionalPersonNameSchema = z.object({
  nome: z.string().trim().optional(),
});

export const hiddenParticipacaoSchema = z.object({
  localidade: requiredText.refine(isMunicipioOption, "Município inexistente."),
  presencas: z.number().int().min(1),
});

export const hiddenMembroInternacionalSchema = z.object({
  pais: requiredText,
  presencas: z.number().int().min(1),
});

export const hiddenVisitanteSchema = z.object({
  cidade: requiredText.refine(isMunicipioOption, "Município inexistente."),
  descricao: z.enum(categoriaVisitanteMapping.codes),
  como_chegou_a_na: z.enum(origemContatoMapping.codes),
});

export const hiddenIngressoSchema = optionalPersonNameSchema.extend({
  cidade: requiredText.refine(isMunicipioOption, "Município inexistente.").optional(),
  visitante_indice: z.number().int().min(0).optional(),
});

export const hiddenTrocaChaveiroSchema = z.object({
  tempo_limpo: z.enum(tempoLimpoMapping.codes),
  quantidade: z.number().int().min(1),
});

export const hiddenAtaSubmissionSchema = z
  .object({
    ata: ataFormSchema,
    servidores: z.array(z.object({ nome: requiredText, funcao: z.string().trim().optional() })),
    participacao: z.array(hiddenParticipacaoSchema),
    membros_internacionais: z.array(hiddenMembroInternacionalSchema).default([]),
    visitantes: z.array(hiddenVisitanteSchema),
    ingressos: z.array(hiddenIngressoSchema),
    trocas_chaveiro: z.array(hiddenTrocaChaveiroSchema),
  })
  .superRefine((submission, context) => {
    const total = [
      ...submission.participacao,
      ...submission.membros_internacionais,
    ].reduce((sum, item) => sum + item.presencas, 0);
    if (total > submission.ata.total_membros_presentes) {
      context.addIssue({
        code: "custom",
        path: ["participacao"],
        message: "A soma das presenças por localidade supera o total de membros presentes.",
      });
    }
    if (submission.ingressos.length > 0 && submission.visitantes.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["ingressos"],
        message:
          "Para registrar um ingresso, registre primeiro pelo menos um visitante.",
      });
    }
  });

export type HiddenAtaSubmission = z.infer<typeof hiddenAtaSubmissionSchema>;

function municipioParts(value: string) {
  const match = /^(.*) - ([A-Z]{2})$/.exec(value);
  if (!match) return { localidade: value, estado: "", pais: "Brasil" };
  return { localidade: match[1], estado: match[2], pais: "Brasil" };
}

function personName(item: { nome?: string }) {
  return item.nome?.trim() || "Anonimo";
}

export function normalizeHiddenAtaSubmission(
  submission: HiddenAtaSubmission,
): AtaSubmission {
  return {
    ata: submission.ata,
    servidores: submission.servidores.map((item) => ({
      nome: item.nome,
      funcao: item.funcao ?? "",
    })),
    participacao: [
      ...submission.participacao.map((item) => ({
        ...municipioParts(item.localidade),
        presencas: item.presencas,
      })),
      ...submission.membros_internacionais.map((item) => ({
        localidade: "",
        estado: "",
        pais: item.pais,
        presencas: item.presencas,
      })),
    ],
    visitantes: submission.visitantes.map((item) => ({
      cidade: item.cidade,
      descricao: item.descricao,
      como_chegou_a_na: item.como_chegou_a_na,
    })),
    ingressos: submission.ingressos.map((item) => ({
      ...(item.visitante_indice !== undefined
        ? { visitante_indice: item.visitante_indice }
        : { nome: personName(item), cidade: item.cidade ?? "" }),
    })),
    trocas_chaveiro: submission.trocas_chaveiro,
  };
}
