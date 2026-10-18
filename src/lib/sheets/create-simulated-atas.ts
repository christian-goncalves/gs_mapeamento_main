import type { sheets_v4 } from "@googleapis/sheets";
import type { AtaCreationIdentifiers } from "@/domain/ata-identifiers";
import {
  nextAtaCreationIdentifiers,
  type AtaIdentifier,
} from "@/domain/ata-identifiers";
import {
  createMonthlySimulationPlan,
  validateMonthlySimulation,
  type AtaBusinessKey,
  type SimulationPlan,
} from "@/domain/ata-simulation";
import {
  ataCompletaSchema,
  type AtaCompleta,
} from "@/domain/rules";
import {
  materializeAtaSubmission,
  type SubmissionIdentity,
} from "@/domain/submission";
import type { Grupo, GrupoHorario } from "@/domain/schemas";
import { SHEET_HEADERS, type SheetName } from "./contract";
import { rowsToCompatibleObjects, sheetReadRange } from "./contract-v2";
import { parseRows, type SheetCell } from "./rows";
import {
  sheetAtaBusinessKeySchema,
  sheetAtaIdentifiersSchema,
  sheetGrupoHorarioSchema,
  sheetGrupoHorarioToDomain,
  sheetGrupoSchema,
  sheetGrupoToDomain,
} from "./schemas";
import {
  buildMonthlyAtomicWriteRequests,
  executeAtomicBatch,
  firstEmptyDataRowNumber,
  type BatchUpdateClient,
} from "./write";

type RecordSheetName = Exclude<
  SheetName,
  "grupos" | "usuarios_grupo" | "grupo_horarios" | "grupo_servidores_mesa"
>;

const RECORD_SHEETS: RecordSheetName[] = [
  "atas",
  "servidores",
  "participacao",
  "visitantes",
  "ingressos",
  "trocas_chaveiro",
];

export type SimulationSheetsClient = BatchUpdateClient & {
  spreadsheets: BatchUpdateClient["spreadsheets"] & {
    values: {
      batchGet: (request: {
        spreadsheetId: string;
        ranges: string[];
        valueRenderOption?: string;
        dateTimeRenderOption?: string;
      }) => Promise<{
        data: {
          valueRanges?: { values?: unknown[][] }[];
        };
      }>;
    };
    get: (request: {
      spreadsheetId: string;
      fields: string;
    }) => Promise<{
      data: sheets_v4.Schema$Spreadsheet;
    }>;
  };
};

export type SimulationSheetSnapshot = {
  values: Record<SheetName, SheetCell[][]>;
  sheetIds: Record<SheetName, number>;
  rowCounts: Record<SheetName, number>;
  groups: Grupo[];
  schedules: GrupoHorario[];
  existingKeys: AtaBusinessKey[];
  identifiers: AtaIdentifier[];
  recordIds: Record<RecordSheetName, string[]>;
};

export type PreparedSimulationCommit = {
  plan: SimulationPlan;
  records: AtaCompleta[];
  requests: sheets_v4.Schema$Request[];
};

export type ReconciliationState =
  | "committed"
  | "not-committed"
  | "partial-or-unknown";

function normalizeHeaderAliases(name: SheetName, values: SheetCell[][]) {
  if (name !== "visitantes" || values.length === 0) return values;
  const [headers, ...rows] = values;
  return [
    headers.map((header) => {
      if (header === "categoria") return "descricao";
      if (header === "origem_contato" || header === "como_chegou_a_na?") {
        return "como_chegou_a_na";
      }
      return header;
    }),
    ...rows,
  ];
}

function requireValidRows<T>(
  name: string,
  rows: ReturnType<typeof parseRows<T>>,
) {
  const invalid = rows.filter((row) => !row.valid);
  if (invalid.length > 0) {
    throw new Error(
      `${name} contém ${invalid.length} linha(s) inválida(s); corrija o Sheets antes da simulação.`,
    );
  }
  return rows.flatMap((row) => (row.valid ? [row.data] : []));
}

export async function readSimulationSheetSnapshot(
  client: SimulationSheetsClient,
  spreadsheetId: string,
): Promise<SimulationSheetSnapshot> {
  if (!spreadsheetId) throw new Error("ID DEV ausente.");
  const names = Object.keys(SHEET_HEADERS) as SheetName[];
  const [valuesResponse, metadataResponse] = await Promise.all([
    client.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: names.map(sheetReadRange),
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "SERIAL_NUMBER",
    }),
    client.spreadsheets.get({
      spreadsheetId,
      fields: "sheets(properties(sheetId,title,gridProperties(rowCount)))",
    }),
  ]);
  const values = Object.fromEntries(
    names.map((name, index) => [
      name,
      normalizeHeaderAliases(
        name,
        ((valuesResponse.data.valueRanges?.[index]?.values ?? []) as
          | SheetCell[][]
          | undefined) ?? [],
      ),
    ]),
  ) as Record<SheetName, SheetCell[][]>;
  const objects = Object.fromEntries(
    names.map((name) => [
      name,
      rowsToCompatibleObjects(
        name,
        values[name],
        name === "grupos" ? { allowMissingTrailingHeaders: 3 } : undefined,
      ),
    ]),
  ) as Record<SheetName, ReturnType<typeof rowsToCompatibleObjects>>;
  const groups = requireValidRows(
    "grupos",
    parseRows("grupos", sheetGrupoSchema, objects.grupos, sheetGrupoToDomain),
  );
  const schedules = requireValidRows(
    "grupo_horarios",
    parseRows(
      "grupo_horarios",
      sheetGrupoHorarioSchema,
      objects.grupo_horarios,
      sheetGrupoHorarioToDomain,
    ),
  );
  const existingKeys = objects.atas.map((row) =>
    sheetAtaBusinessKeySchema.parse(row.value),
  );
  const identifiers = objects.atas.map((row) =>
    sheetAtaIdentifiersSchema.parse(row.value),
  );
  const sheetIds = Object.fromEntries(
    (metadataResponse.data.sheets ?? []).flatMap((sheet) => {
      const title = sheet.properties?.title;
      const id = sheet.properties?.sheetId;
      return title && typeof id === "number" ? [[title, id]] : [];
    }),
  ) as Partial<Record<SheetName, number>>;
  const rowCounts = Object.fromEntries(
    (metadataResponse.data.sheets ?? []).flatMap((sheet) => {
      const title = sheet.properties?.title;
      const count = sheet.properties?.gridProperties?.rowCount;
      return title && typeof count === "number" ? [[title, count]] : [];
    }),
  ) as Partial<Record<SheetName, number>>;
  for (const name of names) {
    if (typeof sheetIds[name] !== "number") {
      throw new Error(`ID da aba ${name} não encontrado.`);
    }
    if (typeof rowCounts[name] !== "number") {
      throw new Error(`Quantidade de linhas da aba ${name} não encontrada.`);
    }
  }
  const recordIds = Object.fromEntries(
    RECORD_SHEETS.map((name) => [
      name,
      objects[name]
        .map((row) => row.value[SHEET_HEADERS[name][0]])
        .filter((value): value is string => typeof value === "string" && !!value),
    ]),
  ) as Record<RecordSheetName, string[]>;
  return {
    values,
    sheetIds: sheetIds as Record<SheetName, number>,
    rowCounts: rowCounts as Record<SheetName, number>,
    groups,
    schedules,
    existingKeys,
    identifiers,
    recordIds,
  };
}

export function assertDevSimulationGate(options: {
  enabled: string | undefined;
  configuredDevId: string | undefined;
  targetId: string | undefined;
  authorized: boolean;
  productionRequested?: boolean;
}) {
  if (options.productionRequested) {
    throw new Error("Produção é tecnicamente bloqueada para simulações.");
  }
  if (options.enabled !== "true") {
    throw new Error("ATA_SIMULATION_ENABLED deve ser exatamente true.");
  }
  if (!options.configuredDevId) {
    throw new Error("GOOGLE_SHEETS_DEV_ID é obrigatório.");
  }
  if (!options.targetId || options.targetId !== options.configuredDevId) {
    throw new Error("O destino não corresponde ao Google Sheets DEV configurado.");
  }
  if (!options.authorized) {
    throw new Error("Autorização explícita ausente.");
  }
  return options.configuredDevId;
}

function sameBusinessData(first: SimulationPlan, second: SimulationPlan) {
  return (
    first.grupo.grupo_id === second.grupo.grupo_id &&
    JSON.stringify(first.horarios) === JSON.stringify(second.horarios) &&
    JSON.stringify(first.submissions) === JSON.stringify(second.submissions)
  );
}

function materializeMonthlyRecords(
  plan: SimulationPlan,
  existing: readonly AtaIdentifier[],
  identity?: SubmissionIdentity,
) {
  const identifiers = [...existing];
  return plan.submissions.map((submission) => {
    const next: AtaCreationIdentifiers = nextAtaCreationIdentifiers(
      plan.grupo.grupo_id,
      identifiers,
    );
    const record = ataCompletaSchema.parse(
      materializeAtaSubmission(submission, identity, next),
    );
    identifiers.push({
      ata_id: record.ata.ata_id,
      grupo_id: record.ata.grupo_id,
      numero_sequencial_grupo: record.ata.numero_sequencial_grupo,
      indice_personalizado_grupo: record.ata.indice_personalizado_grupo,
    });
    return record;
  });
}

function recordCounts(records: readonly AtaCompleta[]) {
  return {
    atas: records.length,
    servidores: records.reduce(
      (total, record) => total + record.servidores.length,
      0,
    ),
    participacao: records.reduce(
      (total, record) => total + record.participacao.length,
      0,
    ),
    visitantes: records.reduce(
      (total, record) => total + record.visitantes.length,
      0,
    ),
    ingressos: records.reduce(
      (total, record) => total + record.ingressos.length,
      0,
    ),
    trocas_chaveiro: records.reduce(
      (total, record) => total + record.trocas_chaveiro.length,
      0,
    ),
  } satisfies Record<RecordSheetName, number>;
}

function buildRowExpansionRequests(
  records: readonly AtaCompleta[],
  snapshot: SimulationSheetSnapshot,
  nextRows: Record<RecordSheetName, number>,
): sheets_v4.Schema$Request[] {
  const counts = recordCounts(records);
  return RECORD_SHEETS.flatMap((sheet) => {
    const requiredRowCount = nextRows[sheet] - 1 + counts[sheet];
    const missingRows = requiredRowCount - snapshot.rowCounts[sheet];
    if (missingRows <= 0) return [];
    return [
      {
        appendDimension: {
          sheetId: snapshot.sheetIds[sheet],
          dimension: "ROWS",
          length: missingRows,
        },
      },
    ];
  });
}

export function prepareSimulationCommit(
  planned: SimulationPlan,
  current: SimulationSheetSnapshot,
  identity?: SubmissionIdentity,
): PreparedSimulationCommit {
  const regenerated = createMonthlySimulationPlan(
    planned.input,
    current.groups,
    current.schedules,
    current.existingKeys,
  );
  validateMonthlySimulation(regenerated);
  if (!sameBusinessData(planned, regenerated)) {
    throw new Error(
      "O grupo, os horários ou os dados planejados mudaram; gere um novo planejamento.",
    );
  }
  const records = materializeMonthlyRecords(
    regenerated,
    current.identifiers,
    identity,
  );
  const nextRows = Object.fromEntries(
    RECORD_SHEETS.map((name) => [
      name,
      firstEmptyDataRowNumber(current.values[name]),
    ]),
  ) as Record<RecordSheetName, number>;
  return {
    plan: regenerated,
    records,
    requests: [
      ...buildRowExpansionRequests(records, current, nextRows),
      ...buildMonthlyAtomicWriteRequests(
        records,
        current.sheetIds,
        nextRows,
      ),
    ],
  };
}

export async function executePreparedSimulationCommit(
  client: BatchUpdateClient,
  spreadsheetId: string,
  prepared: PreparedSimulationCommit,
) {
  await executeAtomicBatch(client, spreadsheetId, prepared.requests);
}

export function isUnknownBatchResult(error: unknown) {
  if (!error || typeof error !== "object") return true;
  const candidate = error as {
    code?: string | number;
    response?: { status?: number };
  };
  const status = candidate.response?.status;
  if (typeof status === "number") return status >= 500;
  if (typeof candidate.code === "number") return candidate.code >= 500;
  return (
    typeof candidate.code !== "string" ||
    ["ECONNRESET", "ETIMEDOUT", "EPIPE", "ENETUNREACH"].includes(candidate.code)
  );
}

function idsFromRecords(records: readonly AtaCompleta[]) {
  return {
    atas: records.map((record) => record.ata.ata_id),
    servidores: records.flatMap((record) =>
      record.servidores.map((item) => item.servidor_id),
    ),
    participacao: records.flatMap((record) =>
      record.participacao.map((item) => item.participacao_id),
    ),
    visitantes: records.flatMap((record) =>
      record.visitantes.map((item) => item.visitante_id),
    ),
    ingressos: records.flatMap((record) =>
      record.ingressos.map((item) => item.ingresso_id),
    ),
    trocas_chaveiro: records.flatMap((record) =>
      record.trocas_chaveiro.map((item) => item.troca_chaveiro_id),
    ),
  } satisfies Record<RecordSheetName, string[]>;
}

export function reconcilePreparedSimulation(
  prepared: PreparedSimulationCommit,
  snapshot: SimulationSheetSnapshot,
): ReconciliationState {
  const expectedIds = idsFromRecords(prepared.records);
  let found = 0;
  let expected = 0;
  for (const sheet of RECORD_SHEETS) {
    const present = new Set(snapshot.recordIds[sheet]);
    for (const id of expectedIds[sheet]) {
      expected += 1;
      if (present.has(id)) found += 1;
    }
  }
  const keySet = new Set(
    snapshot.existingKeys.map(
      (key) => `${key.grupo_id}|${key.data_reuniao}|${key.hora_inicio}`,
    ),
  );
  const foundKeys = prepared.plan.submissions.filter((submission) =>
    keySet.has(
      `${submission.ata.grupo_id}|${submission.ata.data_reuniao}|${submission.ata.hora_inicio}`,
    ),
  ).length;
  if (found === expected && foundKeys === prepared.plan.submissions.length) {
    return "committed";
  }
  if (found === 0 && foundKeys === 0) return "not-committed";
  return "partial-or-unknown";
}
