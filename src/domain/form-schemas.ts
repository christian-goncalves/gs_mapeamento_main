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
const optionalText = z.string().trim();
const optionalDuration = optionalText.refine(
  (value) => !value || /^(?:[0-9]{1,2}):[0-5]\d$/.test(value),
  "A duração deve usar o formato H:MM.",
);
const requiredEmail = requiredText.refine(
  (value) => z.email().safeParse(value).success,
  "E-mail inválido.",
);
const zoomId = requiredText.refine((value) => {
  if (/^\d{8,12}$/.test(value)) return true;
  const parsed = z.url().safeParse(value);
  if (!parsed.success) return false;
  return /(^|\.)zoom\.us$/i.test(new URL(value).hostname);
}, "Informe um ID numérico do Zoom ou uma URL válida do Zoom.");

export const grupoFormSchema = z.object({
  zoom_id: zoomId,
  grupo_nome: requiredText,
  ativo: z.boolean(),
  responsavel_grupo_nome: requiredText,
  responsavel_grupo_email: requiredEmail,
  email_acesso_grupo: requiredEmail,
  ultima_reuniao_anterior: z.number().int().min(0),
});

export const grupoHorarioFormSchema = z.object({
  grupo_id: z.string().uuid(),
  dia_semana: z.enum([
    "domingo",
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
  ]),
  hora_inicio: horaInicioSchema,
  link_reuniao: optionalText,
  ativo: z.boolean(),
});

export const ataFormSchema = z.object({
  grupo_id: z.string().uuid(),
  data_reuniao: z.string().date(),
  hora_inicio: horaInicioSchema,
  duracao: optionalDuration,
  formato_outros: optionalText,
  preenchido_por: requiredText,
  plataforma: z.enum(plataformaMapping.codes),
  tipo_reuniao: z.enum(tipoReuniaoMapping.codes),
  formatos: z.array(z.enum(formatoMapping.codes)).min(1),
  total_membros_presentes: z.number().int().min(1),
  total_partilhas: z.number().int().min(1),
}).superRefine((ata, context) => {
  if (ata.formatos.includes("outros") && !ata.formato_outros) {
    context.addIssue({
      code: "custom",
      path: ["formato_outros"],
      message: "Descreva o formato outros.",
    });
  }
});

export const servidorFormSchema = z.object({
  nome: requiredText,
  funcao: optionalText,
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

export const ingressoFormSchema = z.object({
  nome: requiredText,
  cidade: requiredText.refine(isMunicipioOption, "Município inexistente."),
});

export const trocaChaveiroFormSchema = z.object({
  tempo_limpo: z.enum(tempoLimpoMapping.codes),
  quantidade: z.number().int().min(1),
});

export const ataSubmissionSchema = z
  .object({
    ata: ataFormSchema,
    servidores: z.array(servidorFormSchema.omit({ ordem: true })),
    participacao: z.array(participacaoFormSchema),
    visitantes: z.array(visitanteFormSchema),
    ingressos: z.array(ingressoFormSchema),
    trocas_chaveiro: z.array(trocaChaveiroFormSchema),
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

export type AtaSubmission = z.infer<typeof ataSubmissionSchema>;
