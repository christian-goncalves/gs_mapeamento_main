import { calcularIndicadores, type AtaCompleta } from "./rules";
import { validateContractIntegrity, type ContractRows } from "./integrity";
import type {
  Ata,
  Grupo,
  GrupoHorario,
  Ingresso,
  Participacao,
  Servidor,
  TrocaChaveiro,
  Visitante,
} from "./schemas";
import { diaSemanaOrder as weekDayOrder } from "./schemas";
import type { ParsedRow, RowDiagnostic } from "@/lib/sheets/rows";

type ValidRow<T> = Extract<ParsedRow<T>, { valid: true }>;

export type ParsedContractRows = {
  grupos: ParsedRow<Grupo>[];
  grupo_horarios: ParsedRow<GrupoHorario>[];
  atas: ParsedRow<Ata>[];
  servidores: ParsedRow<Servidor>[];
  participacao: ParsedRow<Participacao>[];
  visitantes: ParsedRow<Visitante>[];
  ingressos: ParsedRow<Ingresso>[];
  trocas_chaveiro: ParsedRow<TrocaChaveiro>[];
};

export type AggregatedAta = {
  grupo: Grupo;
  registro: AtaCompleta;
  indicadores: ReturnType<typeof calcularIndicadores>;
};

export type AggregatedRead = {
  grupos: Grupo[];
  grupo_horarios: GrupoHorario[];
  atas: AggregatedAta[];
  diagnostics: RowDiagnostic[];
};

function validRows<T>(rows: ParsedRow<T>[]) {
  return rows.filter((row): row is ValidRow<T> => row.valid);
}

function rowDiagnostics<T>(rows: ParsedRow<T>[]) {
  return rows.flatMap((row) => (row.valid ? [] : row.diagnostics));
}

function locationKey(row: { sheet: string; rowNumber: number }) {
  return `${row.sheet}:${row.rowNumber}`;
}

function withoutDiagnosed<T>(
  rows: ValidRow<T>[],
  diagnostics: RowDiagnostic[],
) {
  const rejected = new Set(diagnostics.map(locationKey));
  return rows.filter((row) => !rejected.has(locationKey(row)));
}

function referenceDiagnostic(
  row: { sheet: string; rowNumber: number },
  field: string,
  message: string,
): RowDiagnostic {
  return {
    sheet: row.sheet,
    rowNumber: row.rowNumber,
    field,
    message,
  };
}

function filterAtaReferences<T extends { ata_id: string }>(
  rows: ValidRow<T>[],
  ataIds: Set<string>,
  diagnostics: RowDiagnostic[],
) {
  return rows.filter((row) => {
    if (ataIds.has(row.data.ata_id)) return true;
    diagnostics.push(
      referenceDiagnostic(
        row,
        "ata_id",
        "ata_id não referencia uma ata válida.",
      ),
    );
    return false;
  });
}

function byAta<T extends { ata_id: string }>(rows: ValidRow<T>[]) {
  const grouped = new Map<string, ValidRow<T>[]>();
  for (const row of rows) {
    const current = grouped.get(row.data.ata_id) ?? [];
    current.push(row);
    grouped.set(row.data.ata_id, current);
  }
  return grouped;
}

export function aggregateContractRows(rows: ParsedContractRows): AggregatedRead {
  const diagnostics = [
    ...rowDiagnostics(rows.grupos),
    ...rowDiagnostics(rows.grupo_horarios ?? []),
    ...rowDiagnostics(rows.atas),
    ...rowDiagnostics(rows.servidores),
    ...rowDiagnostics(rows.participacao),
    ...rowDiagnostics(rows.visitantes),
    ...rowDiagnostics(rows.ingressos),
    ...rowDiagnostics(rows.trocas_chaveiro),
  ];
  const initiallyValid: ContractRows = {
    grupos: validRows(rows.grupos),
    grupo_horarios: validRows(rows.grupo_horarios ?? []),
    atas: validRows(rows.atas),
    servidores: validRows(rows.servidores),
    participacao: validRows(rows.participacao),
    visitantes: validRows(rows.visitantes),
    ingressos: validRows(rows.ingressos),
    trocas_chaveiro: validRows(rows.trocas_chaveiro),
  };

  const integrityDiagnostics = validateContractIntegrity(initiallyValid);
  diagnostics.push(...integrityDiagnostics);

  const grupos = withoutDiagnosed(
    initiallyValid.grupos,
    integrityDiagnostics,
  );
  const grupoById = new Map(grupos.map((row) => [row.data.grupo_id, row]));
  const grupoHorarios = withoutDiagnosed(
    initiallyValid.grupo_horarios,
    integrityDiagnostics,
  ).filter((row) => {
    if (grupoById.has(row.data.grupo_id)) return true;
    diagnostics.push(
      referenceDiagnostic(
        row,
        "grupo_id",
        "grupo_id não referencia um grupo válido.",
      ),
    );
    return false;
  });
  const atas = withoutDiagnosed(initiallyValid.atas, integrityDiagnostics).filter(
    (row) => {
      if (grupoById.has(row.data.grupo_id)) return true;
      diagnostics.push(
        referenceDiagnostic(
          row,
          "grupo_id",
          "grupo_id não referencia um grupo válido.",
        ),
      );
      return false;
    },
  );
  const ataIds = new Set(atas.map((row) => row.data.ata_id));

  const servidores = filterAtaReferences(
    withoutDiagnosed(initiallyValid.servidores, integrityDiagnostics),
    ataIds,
    diagnostics,
  );
  let participacao = filterAtaReferences(
    withoutDiagnosed(initiallyValid.participacao, integrityDiagnostics),
    ataIds,
    diagnostics,
  );
  const visitantes = filterAtaReferences(
    withoutDiagnosed(initiallyValid.visitantes, integrityDiagnostics),
    ataIds,
    diagnostics,
  );
  const ingressos = filterAtaReferences(
    withoutDiagnosed(initiallyValid.ingressos, integrityDiagnostics),
    ataIds,
    diagnostics,
  );
  const trocas = filterAtaReferences(
    withoutDiagnosed(initiallyValid.trocas_chaveiro, integrityDiagnostics),
    ataIds,
    diagnostics,
  );

  const ataById = new Map(atas.map((row) => [row.data.ata_id, row.data]));
  const invalidParticipationAtas = new Set<string>();
  for (const [ataId, participationRows] of byAta(participacao)) {
    const total = participationRows.reduce(
      (sum, row) => sum + row.data.presencas,
      0,
    );
    const ata = ataById.get(ataId);
    if (ata && total > ata.total_membros_presentes) {
      invalidParticipationAtas.add(ataId);
      for (const row of participationRows) {
        diagnostics.push(
          referenceDiagnostic(
            row,
            "presencas",
            "A soma das presenças supera o total de membros da ata.",
          ),
        );
      }
    }
  }
  participacao = participacao.filter(
    (row) => !invalidParticipationAtas.has(row.data.ata_id),
  );

  const servidoresByAta = byAta(servidores);
  const participacaoByAta = byAta(participacao);
  const visitantesByAta = byAta(visitantes);
  const ingressosByAta = byAta(ingressos);
  const trocasByAta = byAta(trocas);
  const aggregatedAtas = atas.map((ataRow) => {
    const ata = ataRow.data;
    const registro: AtaCompleta = {
      ata,
      servidores: (servidoresByAta.get(ata.ata_id) ?? [])
        .map((row) => row.data)
        .sort((first, second) => first.ordem - second.ordem),
      participacao: (participacaoByAta.get(ata.ata_id) ?? []).map(
        (row) => row.data,
      ),
      visitantes: (visitantesByAta.get(ata.ata_id) ?? []).map(
        (row) => row.data,
      ),
      ingressos: (ingressosByAta.get(ata.ata_id) ?? []).map(
        (row) => row.data,
      ),
      trocas_chaveiro: (trocasByAta.get(ata.ata_id) ?? []).map(
        (row) => row.data,
      ),
    };
    return {
      grupo: grupoById.get(ata.grupo_id)!.data,
      registro,
      indicadores: calcularIndicadores(registro),
    };
  });

  return {
    grupos: grupos.map((row) => row.data),
    grupo_horarios: grupoHorarios
      .map((row) => row.data)
      .sort(
        (first, second) =>
          first.grupo_id.localeCompare(second.grupo_id) ||
          weekDayOrder[first.dia_semana] - weekDayOrder[second.dia_semana] ||
          first.hora_inicio.localeCompare(second.hora_inicio),
      ),
    atas: aggregatedAtas.sort(
      (first, second) =>
        second.registro.ata.data_reuniao.localeCompare(
          first.registro.ata.data_reuniao,
        ) ||
        second.registro.ata.hora_inicio.localeCompare(
          first.registro.ata.hora_inicio,
        ),
    ),
    diagnostics: diagnostics.sort(
      (first, second) =>
        first.sheet.localeCompare(second.sheet) ||
        first.rowNumber - second.rowNumber ||
        first.field.localeCompare(second.field),
    ),
  };
}
