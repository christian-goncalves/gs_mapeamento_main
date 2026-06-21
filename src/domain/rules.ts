import { z } from "zod";
import {
  ataSchema,
  participacaoSchema,
  servidorSchema,
  trocaChaveiroSchema,
  visitanteSchema,
} from "./entities";

export const ataCompletaSchema = z
  .object({
    ata: ataSchema,
    servidores: z.array(servidorSchema),
    participacao: z.array(participacaoSchema),
    visitantes: z.array(visitanteSchema),
    trocas_chaveiro: z.array(trocaChaveiroSchema),
  })
  .superRefine((registro, context) => {
    const ataId = registro.ata.ata_id;
    const dependentes = [
      ...registro.servidores,
      ...registro.participacao,
      ...registro.visitantes,
      ...registro.trocas_chaveiro,
    ];

    if (dependentes.some((item) => item.ata_id !== ataId)) {
      context.addIssue({
        code: "custom",
        message: "Todos os registros relacionados devem usar o ata_id da ata.",
      });
    }

    const ordens = registro.servidores.map((servidor) => servidor.ordem);
    if (new Set(ordens).size !== ordens.length) {
      context.addIssue({
        code: "custom",
        path: ["servidores"],
        message: "A ordem dos servidores deve ser única por ata.",
      });
    }

    const presencas = registro.participacao.reduce(
      (total, item) => total + item.presencas,
      0,
    );
    if (presencas > registro.ata.total_membros_presentes) {
      context.addIssue({
        code: "custom",
        path: ["participacao"],
        message: "A soma das presenças supera o total de membros presentes.",
      });
    }
  });

export type AtaCompleta = z.infer<typeof ataCompletaSchema>;

export function calcularIndicadores(registro: AtaCompleta) {
  const localidades = new Set(
    registro.participacao.map((item) =>
      `${item.localidade}|${item.estado}|${item.pais}`.toLocaleLowerCase("pt-BR"),
    ),
  );
  const estados = new Set(
    registro.participacao
      .map((item) => item.estado.trim().toLocaleLowerCase("pt-BR"))
      .filter(Boolean),
  );
  const paises = new Set(
    registro.participacao.map((item) =>
      item.pais.trim().toLocaleLowerCase("pt-BR"),
    ),
  );
  const presencasInformadas = registro.participacao.reduce(
    (total, item) => total + item.presencas,
    0,
  );

  return {
    total_localidades: localidades.size,
    total_estados: estados.size,
    total_paises: paises.size,
    total_visitantes: registro.visitantes.length,
    total_trocas_chaveiro: registro.trocas_chaveiro.length,
    membros_sem_localidade:
      registro.ata.total_membros_presentes - presencasInformadas,
  };
}
