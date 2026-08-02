import { z } from "zod";
import {
  categoriaVisitanteMapping,
  fusoHorarioMapping,
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
const optionalEmail = optionalText.refine(
  (value) => !value || z.email().safeParse(value).success,
  "E-mail inválido.",
);
export const grupoFormSchema = z.object({
  acesso_plataforma: requiredText,
  plataforma: z.enum(plataformaMapping.codes),
  fuso_horario: z.enum(fusoHorarioMapping.codes),
  grupo_nome: requiredText,
  ativo: z.boolean(),
  responsavel_grupo_nome: optionalText.default(""),
  responsavel_grupo_email: optionalEmail.default(""),
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
    localidade: z.string().trim(),
    estado: z.string().trim(),
    pais: requiredText,
    presencas: z.number().int().min(1),
  })
  .superRefine((item, context) => {
    const brasil = item.pais === "Brasil";
    if (brasil && !item.localidade) {
      context.addIssue({
        code: "custom",
        path: ["localidade"],
        message: "Localidade é obrigatória quando o país é Brasil.",
      });
    }
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
  cidade: requiredText.refine(isMunicipioOption, "Município inexistente."),
  descricao: z.enum(categoriaVisitanteMapping.codes),
  como_chegou_a_na: z.enum(origemContatoMapping.codes),
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

export type AtaSubmission = z.infer<typeof ataSubmissionSchema>;
