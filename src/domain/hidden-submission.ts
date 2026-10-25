import { z } from "zod";
import {
  categoriaVisitanteMapping,
  origemContatoMapping,
  tempoLimpoMapping,
} from "./enums";
import { ataFormSchema, type AtaSubmission } from "./form-schemas";
import { isMunicipioOption } from "./municipios";

const requiredText = z.string().trim().min(1, "Campo obrigatório.");

export const hiddenParticipacaoSchema = z.object({
  localidade: requiredText.refine(isMunicipioOption, "Município inexistente."),
  presencas: z.number().int().min(1),
});

export const hiddenMembroInternacionalSchema = z.object({
  pais: requiredText.refine(
    (value) => value.localeCompare("Brasil", "pt-BR", { sensitivity: "accent" }) !== 0,
    "Brasil deve ser cadastrado em Localidades nacionais.",
  ),
  presencas: z.number().int().min(1),
});

export const hiddenVisitanteSchema = z.object({
  cidade: requiredText.refine(isMunicipioOption, "Município inexistente."),
  descricao: z.enum(categoriaVisitanteMapping.codes),
  como_chegou_a_na: z.enum(origemContatoMapping.codes),
});

export const hiddenIngressoSchema = z.object({
  cidade: requiredText.refine(isMunicipioOption, "Município inexistente."),
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
    const visitorCities = new Set(
      submission.visitantes.map((visitor) => normalizeCityKey(visitor.cidade)),
    );
    for (const [index, ingresso] of submission.ingressos.entries()) {
      if (!visitorCities.has(normalizeCityKey(ingresso.cidade))) {
        context.addIssue({
          code: "custom",
          path: ["ingressos", index, "cidade"],
          message: "A cidade do ingresso deve estar entre as cidades dos visitantes.",
        });
      }
    }
  });

export type HiddenAtaSubmission = z.infer<typeof hiddenAtaSubmissionSchema>;

function municipioParts(value: string) {
  const match = /^(.*) - ([A-Z]{2})$/.exec(value);
  if (!match) return { localidade: value, estado: "", pais: "Brasil" };
  return { localidade: match[1], estado: match[2], pais: "Brasil" };
}

function normalizeCityKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
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
    ingressos: submission.ingressos.map((item) => ({ cidade: item.cidade })),
    trocas_chaveiro: submission.trocas_chaveiro,
  };
}
