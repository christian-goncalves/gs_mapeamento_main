import { z } from "zod";
import {
  categoriaVisitanteMapping,
  formatoMapping,
  origemContatoMapping,
  plataformaMapping,
  tempoLimpoMapping,
  tipoReuniaoMapping,
} from "./enums";
import { isMunicipioOption } from "./municipios";

const requiredText = z.string().trim().min(1, "Campo obrigatório.");
const optionalText = z.string().trim().default("");
const optionalEmail = optionalText.refine(
  (value) => !value || z.email().safeParse(value).success,
  "E-mail inválido.",
);
const optionalSlug = optionalText.refine(
  (value) => /^[a-z0-9-]*$/.test(value),
  "O link deve usar apenas letras minúsculas, números e hífen.",
);
const uuid = z.string().uuid("UUID inválido.");
const timestamp = z.string().datetime({ offset: true });
const auditFields = { created_at: timestamp, updated_at: timestamp };

export const horaInicioSchema = z
  .string()
  .regex(
    /^(?:[01]\d|2[0-3]):(?:00|30)$/,
    "O horário deve usar intervalos de 30 minutos.",
  );

export const diaSemanaSchema = z.enum([
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
]);

export const diaSemanaOrder = Object.fromEntries(
  diaSemanaSchema.options.map((dia, index) => [dia, index]),
) as Record<z.infer<typeof diaSemanaSchema>, number>;

export const grupoSchema = z.object({
  grupo_id: uuid,
  zoom_id: requiredText,
  grupo_nome: requiredText,
  ordem: z.number().int().min(1),
  ativo: z.boolean(),
  responsavel_grupo_nome: optionalText,
  responsavel_grupo_email: optionalEmail,
  email_acesso_grupo: optionalEmail,
  responsaveis_ata: optionalText,
  link_formulario_ata: optionalSlug,
  ...auditFields,
});

export const grupoHorarioSchema = z.object({
  horario_id: uuid,
  grupo_id: uuid,
  dia_semana: diaSemanaSchema,
  hora_inicio: horaInicioSchema,
  link_reuniao: optionalText,
  ativo: z.boolean(),
  ...auditFields,
});

export const usuarioGrupoStatusSchema = z.enum([
  "pendente",
  "ativo",
  "inativo",
]);

export const usuarioGrupoSchema = z.object({
  usuario_id: uuid,
  grupo_id: uuid,
  email: requiredText.refine(
    (value) => z.email().safeParse(value).success,
    "E-mail inválido.",
  ),
  nome: optionalText,
  senha_hash: optionalText,
  status: usuarioGrupoStatusSchema,
  convite_token: optionalText,
  convite_expira_em: optionalText,
  ultimo_login: optionalText,
  ...auditFields,
});

export const ataSchema = z.object({
  ata_id: uuid,
  grupo_id: uuid,
  data_reuniao: z.string().date(),
  hora_inicio: horaInicioSchema,
  preenchido_por: requiredText,
  plataforma: z.enum(plataformaMapping.codes),
  tipo_reuniao: z.enum(tipoReuniaoMapping.codes),
  formatos: z.array(z.enum(formatoMapping.codes)).min(1),
  total_membros_presentes: z.number().int().min(1),
  total_partilhas: z.number().int().min(1),
  ...auditFields,
});

export const servidorSchema = z.object({
  servidor_id: uuid,
  ata_id: uuid,
  nome: requiredText,
  ordem: z.number().int().min(1),
  ...auditFields,
});

export const participacaoSchema = z
  .object({
    participacao_id: uuid,
    ata_id: uuid,
    localidade: requiredText,
    estado: z.string().trim(),
    pais: requiredText,
    presencas: z.number().int().min(1),
    ...auditFields,
  })
  .superRefine((item, context) => {
    const brasil = item.pais.localeCompare("Brasil", "pt-BR", {
      sensitivity: "accent",
    }) === 0;
    if (brasil && !item.estado) {
      context.addIssue({
        code: "custom",
        path: ["estado"],
        message: "Estado é obrigatório quando o país é Brasil.",
      });
    }
    if (!brasil && item.estado) {
      context.addIssue({
        code: "custom",
        path: ["estado"],
        message: "Estado deve ficar vazio quando o país não é Brasil.",
      });
    }
  });

export const visitanteSchema = z.object({
  visitante_id: uuid,
  ata_id: uuid,
  nome: requiredText,
  cidade: requiredText.refine(isMunicipioOption, "Município inexistente."),
  categoria: z.enum(categoriaVisitanteMapping.codes),
  origem_contato: z.enum(origemContatoMapping.codes),
  ...auditFields,
});

export const ingressoSchema = z.object({
  ingresso_id: uuid,
  ata_id: uuid,
  nome: requiredText,
  cidade: requiredText.refine(isMunicipioOption, "Município inexistente."),
  ...auditFields,
});

export const trocaChaveiroSchema = z.object({
  troca_chaveiro_id: uuid,
  ata_id: uuid,
  tempo_limpo: z.enum(tempoLimpoMapping.codes),
  quantidade: z.number().int().min(1),
  ...auditFields,
});

export type Grupo = z.infer<typeof grupoSchema>;
export type GrupoHorario = z.infer<typeof grupoHorarioSchema>;
export type UsuarioGrupo = z.infer<typeof usuarioGrupoSchema>;
export type Ata = z.infer<typeof ataSchema>;
export type Servidor = z.infer<typeof servidorSchema>;
export type Participacao = z.infer<typeof participacaoSchema>;
export type Visitante = z.infer<typeof visitanteSchema>;
export type Ingresso = z.infer<typeof ingressoSchema>;
export type TrocaChaveiro = z.infer<typeof trocaChaveiroSchema>;
