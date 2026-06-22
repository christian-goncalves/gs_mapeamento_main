import type { AtaSubmission } from "./form-schemas";
import type { Grupo } from "./schemas";
import { requireActiveGroupForCreation } from "./integrity";

export type AtaBusinessKey = Pick<
  AtaSubmission["ata"],
  "grupo_id" | "data_reuniao" | "hora_inicio"
>;

export class DuplicateAtaError extends Error {
  constructor() {
    super("Já existe uma ata para este grupo, data e horário.");
    this.name = "DuplicateAtaError";
  }
}

export function assertCreationAllowed(
  submission: AtaSubmission,
  groups: readonly Grupo[],
  existingKeys: readonly AtaBusinessKey[],
) {
  const matches = groups.filter(
    (group) => group.grupo_id === submission.ata.grupo_id,
  );
  if (matches.length > 1) {
    throw new Error("O grupo selecionado está duplicado no Sheets.");
  }
  const group = requireActiveGroupForCreation(submission.ata.grupo_id, groups);
  const duplicate = existingKeys.some(
    (key) =>
      key.grupo_id === submission.ata.grupo_id &&
      key.data_reuniao === submission.ata.data_reuniao &&
      key.hora_inicio === submission.ata.hora_inicio,
  );
  if (duplicate) throw new DuplicateAtaError();
  return group;
}
