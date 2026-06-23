import { randomUUID } from "node:crypto";
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
): AtaCompleta {
  const timestamp = identity.now();
  const ataId = identity.uuid();
  const audit = { created_at: timestamp, updated_at: timestamp };
  return ataCompletaSchema.parse({
    ata: {
      ata_id: ataId,
      ...submission.ata,
      ...audit,
    },
    servidores: submission.servidores.map((item, index) => ({
      servidor_id: identity.uuid(),
      ata_id: ataId,
      nome: item.nome,
      ordem: index + 1,
      ...audit,
    })),
    participacao: submission.participacao.map((item) => ({
      participacao_id: identity.uuid(),
      ata_id: ataId,
      ...item,
      ...audit,
    })),
    visitantes: submission.visitantes.map((item) => ({
      visitante_id: identity.uuid(),
      ata_id: ataId,
      ...item,
      ...audit,
    })),
    ingressos: submission.ingressos.map((item) => ({
      ingresso_id: identity.uuid(),
      ata_id: ataId,
      ...item,
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
