import type {
  Ata,
  Grupo,
  GrupoHorario,
  GrupoServidorMesa,
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
  grupo_horarios: ValidRow<GrupoHorario>[];
  grupo_servidores_mesa: ValidRow<GrupoServidorMesa>[];
  atas: ValidRow<Ata>[];
  servidores: ValidRow<Servidor>[];
  participacao: ValidRow<Participacao>[];
  visitantes: ValidRow<Visitante>[];
  ingressos: ValidRow<Ingresso>[];
  trocas_chaveiro: ValidRow<TrocaChaveiro>[];
};

function duplicateDiagnostics<T>(
  rows: ValidRow<T>[] = [],
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
  const visitorsById = new Map(rows.visitantes.map((row) => [row.data.visitante_id, row.data]));
  const linkedIngresoDiagnostics = rows.ingressos.flatMap((row) => {
    const visitorId = row.data.visitante_id;
    if (!visitorId) return [];
    const visitor = visitorsById.get(visitorId);
    if (visitor && visitor.ata_id === row.data.ata_id) return [];
    return [{
      sheet: row.sheet,
      rowNumber: row.rowNumber,
      field: "visitante_id",
      message: "visitante_id não referencia um visitante da mesma ata.",
    }];
  });
  return [
    ...linkedIngresoDiagnostics,
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
      rows.atas,
      "numero_sequencial_grupo",
      (item) => `${item.grupo_id}|${item.numero_sequencial_grupo}`,
      "numero_sequencial_grupo duplicado para o mesmo grupo.",
    ),
    ...duplicateDiagnostics(
      rows.atas,
      "indice_personalizado_grupo",
      (item) => `${item.grupo_id}|${item.indice_personalizado_grupo}`,
      "indice_personalizado_grupo duplicado para o mesmo grupo.",
    ),
    ...duplicateDiagnostics(
      rows.grupo_servidores_mesa ?? [],
      "grupo_servidor_mesa_id",
      (item) => item.grupo_servidor_mesa_id,
      "grupo_servidor_mesa_id duplicado.",
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
      rows.grupos.filter((row) => row.data.link_formulario_ata),
      "link_formulario_ata",
      (item) => item.link_formulario_ata,
      "O link do formulário deve ser único entre grupos.",
    ),
    ...duplicateDiagnostics(
      rows.grupos.filter((row) => row.data.email_acesso_grupo),
      "email_acesso_grupo",
      (item) => item.email_acesso_grupo.toLocaleLowerCase("en-US"),
      "O e-mail de acesso deve ser único entre grupos.",
    ),
    ...duplicateDiagnostics(
      rows.grupo_horarios ?? [],
      "horario_id",
      (item) => item.horario_id,
      "horario_id duplicado.",
    ),
    ...duplicateDiagnostics(
      (rows.grupo_horarios ?? []).filter((row) => row.data.ativo),
      "hora_inicio",
      (item) => `${item.grupo_id}|${item.dia_semana}|${item.hora_inicio}`,
      "Horário ativo duplicado para o mesmo grupo, dia e hora.",
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
