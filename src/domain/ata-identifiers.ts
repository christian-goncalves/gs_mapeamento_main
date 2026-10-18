export const DUPLICATE_ATA_CUSTOM_INDEX_MESSAGE =
  "Já existe uma ata deste grupo com este índice personalizado. Escolha outro número.";

export type AtaIdentifier = {
  ata_id: string;
  grupo_id: string;
  numero_sequencial_grupo: number;
  indice_personalizado_grupo: number;
};

export type AtaCreationIdentifiers = {
  numero_sequencial_grupo: number;
  indice_personalizado_grupo: number;
};

export class DuplicateAtaCustomIndexError extends Error {
  constructor() {
    super(DUPLICATE_ATA_CUSTOM_INDEX_MESSAGE);
  }
}

export class DuplicateAtaSequenceError extends Error {
  constructor() {
    super("O número sequencial calculado já existe neste grupo. Atualize e tente novamente.");
  }
}

export class InvalidAtaIdentifiersError extends Error {
  constructor() {
    super("Identificadores de ata inválidos. Reconcile a planilha antes de criar novas atas.");
  }
}

function assertPositiveInteger(value: number, message: string) {
  if (!Number.isInteger(value) || value < 1) throw new Error(message);
}

function groupIdentifiers(
  grupoId: string,
  existing: readonly AtaIdentifier[],
) {
  return existing.filter((item) => item.grupo_id === grupoId);
}

export function nextAtaSequence(
  grupoId: string,
  existing: readonly AtaIdentifier[],
) {
  return Math.max(
    0,
    ...groupIdentifiers(grupoId, existing).map(
      (item) => item.numero_sequencial_grupo,
    ),
  ) + 1;
}

export function assertUniqueAtaSequence(
  grupoId: string,
  sequence: number,
  existing: readonly AtaIdentifier[],
  currentAtaId = "",
) {
  assertPositiveInteger(sequence, "O número sequencial da ata deve ser positivo.");
  const duplicate = groupIdentifiers(grupoId, existing).some(
    (item) =>
      item.ata_id !== currentAtaId &&
      item.numero_sequencial_grupo === sequence,
  );
  if (duplicate) throw new DuplicateAtaSequenceError();
}

export function assertUniqueAtaCustomIndex(
  grupoId: string,
  customIndex: number,
  existing: readonly AtaIdentifier[],
  currentAtaId = "",
) {
  assertPositiveInteger(customIndex, "Informe um índice personalizado positivo.");
  const duplicate = groupIdentifiers(grupoId, existing).some(
    (item) =>
      item.ata_id !== currentAtaId &&
      item.indice_personalizado_grupo === customIndex,
  );
  if (duplicate) throw new DuplicateAtaCustomIndexError();
}

export function nextAtaCreationIdentifiers(
  grupoId: string,
  existing: readonly AtaIdentifier[],
  activeExisting: readonly AtaIdentifier[] = existing,
): AtaCreationIdentifiers {
  const sequence = nextAtaSequence(grupoId, existing);
  assertUniqueAtaSequence(grupoId, sequence, existing);
  assertUniqueAtaCustomIndex(grupoId, sequence, activeExisting);
  return {
    numero_sequencial_grupo: sequence,
    indice_personalizado_grupo: sequence,
  };
}
