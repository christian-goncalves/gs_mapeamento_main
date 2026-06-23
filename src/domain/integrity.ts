import type {
  Ata,
  Grupo,
  Ingresso,
  Participacao,
  Servidor,
  TrocaChaveiro,
  Visitante,
} from "./schemas";
import type { ParsedRow, RowDiagnostic } from "@/lib/sheets/rows";

type ValidRow<T> = Extract<ParsedRow<T>, { valid: true }>;

export type ContractRows = {
  grupos: ValidRow<Grupo>[];
  atas: ValidRow<Ata>[];
  servidores: ValidRow<Servidor>[];
  participacao: ValidRow<Participacao>[];
  visitantes: ValidRow<Visitante>[];
  ingressos: ValidRow<Ingresso>[];
  trocas_chaveiro: ValidRow<TrocaChaveiro>[];
};

function duplicateDiagnostics<T>(
  rows: ValidRow<T>[],
  field: string,
  keyOf: (data: T) => string,
  message: string,
) {
  const seen = new Set<string>();
  const diagnostics: RowDiagnostic[] = [];
  for (const row of rows) {
    const key = keyOf(row.data);
    if (seen.has(key)) {
      diagnostics.push({
        sheet: row.sheet,
        rowNumber: row.rowNumber,
        field,
        message,
      });
    }
    seen.add(key);
  }
  return diagnostics;
}

export function validateContractIntegrity(rows: ContractRows) {
  return [
    ...duplicateDiagnostics(
      rows.grupos,
      "grupo_id",
      (item) => item.grupo_id,
      "grupo_id duplicado.",
    ),
    ...duplicateDiagnostics(
      rows.atas,
      "ata_id",
      (item) => item.ata_id,
      "ata_id duplicado.",
    ),
    ...duplicateDiagnostics(
      rows.servidores,
      "servidor_id",
      (item) => item.servidor_id,
      "servidor_id duplicado.",
    ),
    ...duplicateDiagnostics(
      rows.participacao,
      "participacao_id",
      (item) => item.participacao_id,
      "participacao_id duplicado.",
    ),
    ...duplicateDiagnostics(
      rows.visitantes,
      "visitante_id",
      (item) => item.visitante_id,
      "visitante_id duplicado.",
    ),
    ...duplicateDiagnostics(
      rows.ingressos,
      "ingresso_id",
      (item) => item.ingresso_id,
      "ingresso_id duplicado.",
    ),
    ...duplicateDiagnostics(
      rows.trocas_chaveiro,
      "troca_chaveiro_id",
      (item) => item.troca_chaveiro_id,
      "troca_chaveiro_id duplicado.",
    ),
    ...duplicateDiagnostics(
      rows.grupos,
      "ordem",
      (item) => String(item.ordem),
      "A ordem deve ser única entre grupos.",
    ),
    ...duplicateDiagnostics(
      rows.servidores,
      "ordem",
      (item) => `${item.ata_id}|${item.ordem}`,
      "A ordem deve ser única por ata.",
    ),
  ];
}

export function requireActiveGroupForCreation(
  grupoId: string,
  groups: readonly Grupo[],
) {
  const group = groups.find((item) => item.grupo_id === grupoId);
  if (!group) throw new Error("Grupo inexistente.");
  if (!group.ativo) throw new Error("Grupo inativo não aceita novas atas.");
  return group;
}

export function resolveHistoricalGroup(
  grupoId: string,
  groups: readonly Grupo[],
) {
  const group = groups.find((item) => item.grupo_id === grupoId);
  if (!group) throw new Error("Ata histórica vinculada a grupo inexistente.");
  return group;
}
