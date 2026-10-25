import { randomUUID } from "node:crypto";
import type { AtaCreationIdentifiers } from "./ata-identifiers";
import { ataCompletaSchema, type AtaCompleta } from "./rules";
import type { AtaSubmission } from "./form-schemas";

export type SubmissionIdentity = {
  now: () => string;
  uuid: () => string;
};

const defaultIdentity: SubmissionIdentity = {
  now: () => new Date().toISOString(),
  uuid: () => randomUUID(),
};

export function materializeAtaSubmission(
  submission: AtaSubmission,
  identity: SubmissionIdentity = defaultIdentity,
  identifiers: AtaCreationIdentifiers = {
    numero_sequencial_grupo: 1,
    indice_personalizado_grupo: 1,
  },
): AtaCompleta {
  const timestamp = identity.now();
  const ataId = identity.uuid();
  const audit = { created_at: timestamp, updated_at: timestamp };
  const visitantes = submission.visitantes.map((item, index) => ({
    visitante_id: identity.uuid(),
    ata_id: ataId,
    nome: "visitante_" + (index + 1),
    ...item,
    ...audit,
  }));
  return ataCompletaSchema.parse({
    ata: {
      ata_id: ataId,
      ...identifiers,
      ...submission.ata,
      ...audit,
    },
    servidores: submission.servidores.map((item, index) => ({
      servidor_id: identity.uuid(),
      ata_id: ataId,
      nome: item.nome,
      funcao: item.funcao ?? "",
      ordem: index + 1,
      ...audit,
    })),
    participacao: submission.participacao.map((item) => ({
      participacao_id: identity.uuid(),
      ata_id: ataId,
      ...item,
      ...audit,
    })),
    visitantes,
    ingressos: submission.ingressos.map((item, index) => ({
        ingresso_id: identity.uuid(),
        ata_id: ataId,
        nome: `ingresso_${index + 1}`,
        cidade: item.cidade,
        ...audit,
      })),
    trocas_chaveiro: submission.trocas_chaveiro.map((item) => ({
      troca_chaveiro_id: identity.uuid(),
      ata_id: ataId,
      ...item,
      ...audit,
    })),
  });
}
