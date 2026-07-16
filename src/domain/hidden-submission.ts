import { z } from "zod";
import { tempoLimpoMapping } from "./enums";
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

export const hiddenVisitanteSchema = optionalPersonNameSchema.extend({
  cidade: requiredText.refine(isMunicipioOption, "Município inexistente."),
});

export const hiddenIngressoSchema = optionalPersonNameSchema.extend({
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
    visitantes: z.array(hiddenVisitanteSchema),
    ingressos: z.array(hiddenIngressoSchema),
    trocas_chaveiro: z.array(hiddenTrocaChaveiroSchema),
  })
  .superRefine((submission, context) => {
    const total = submission.participacao.reduce(
      (sum, item) => sum + item.presencas,
      0,
    );
    if (total > submission.ata.total_membros_presentes) {
      context.addIssue({
        code: "custom",
        path: ["participacao"],
        message: "A soma das presenças supera o total de membros presentes.",
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
    servidores: submission.servidores,
    participacao: submission.participacao.map((item) => ({
      ...municipioParts(item.localidade),
      presencas: item.presencas,
    })),
    visitantes: submission.visitantes.map((item) => ({
      nome: personName(item),
      cidade: item.cidade,
      categoria: "outro",
      origem_contato: "outro",
    })),
    ingressos: submission.ingressos.map((item) => ({
      nome: personName(item),
      cidade: item.cidade,
    })),
    trocas_chaveiro: submission.trocas_chaveiro,
  };
}
