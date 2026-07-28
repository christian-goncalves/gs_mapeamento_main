import type { sheets_v4 } from "googleapis";

import {
  categoriaVisitanteMapping,
  origemContatoMapping,
  tempoLimpoMapping,
} from "@/domain/enums";
import { SHEET_HEADERS, type SheetName } from "./contract";

type SheetSnapshot = {
  properties?: {
    sheetId?: number | null;
    title?: string | null;
    gridProperties?: {
      rowCount?: number | null;
    } | null;
  } | null;
};

type ValuesResponse = {
  data: {
    values?: unknown[][] | null;
  };
};

export type ContractReconciliationClient = {
  spreadsheets: {
    get: (request: {
      spreadsheetId: string;
      fields: string;
    }) => Promise<{ data: { sheets?: SheetSnapshot[] | null } }>;
    values: {
      get: (request: {
        spreadsheetId: string;
        range: string;
      }) => Promise<ValuesResponse>;
    };
    batchUpdate: (request: {
      spreadsheetId: string;
      requestBody: { requests: sheets_v4.Schema$Request[] };
    }) => Promise<unknown>;
  };
};

export type ContractReconciliationResult = {
  createdSheets: SheetName[];
  addedColumns: Array<{ sheet: SheetName; column: string }>;
  validatedSheets: SheetName[];
  requestCount: number;
};

const autoCreatableSheets = new Set<SheetName>([
  "ingressos",
  "grupo_horarios",
  "usuarios_grupo",
]);
const sheetNames = Object.keys(SHEET_HEADERS) as SheetName[];
const ataIdentifierColumns = [
  "numero_sequencial_grupo",
  "indice_personalizado_grupo",
] as const;
const ataIdentifierColumnSet = new Set<string>(ataIdentifierColumns);

function headerMismatchMessage(
  sheet: SheetName,
  expected: readonly string[],
  actual: unknown[],
) {
  return `Cabeçalho inválido em ${sheet}. Esperado: ${expected.join(", ")}. Recebido: ${actual.join(", ")}.`;
}

function assertHeader(sheet: SheetName, actual: unknown[]) {
  const expected = SHEET_HEADERS[sheet];
  if (JSON.stringify(actual) !== JSON.stringify([...expected])) {
    throw new Error(headerMismatchMessage(sheet, expected, actual));
  }
}

function isHeaderPrefix(actual: unknown[], expectedPrefix: readonly string[]) {
  return (
    actual.length === expectedPrefix.length &&
    actual.every((header, index) => header === expectedPrefix[index])
  );
}

function headerIndex(sheet: SheetName, column: string) {
  return (SHEET_HEADERS[sheet] as readonly string[]).indexOf(column);
}

const visitorHeaderAliases: Record<string, readonly string[]> = {
  descricao: ["categoria"],
  como_chegou_a_na: ["origem_contato", "como_chegou_a_na?"],
};

function migratableRenamedHeaders(
  sheet: SheetName,
  actual: unknown[],
): { startIndex: number; headers: string[] } | null {
  if (sheet !== "visitantes" || actual.length !== SHEET_HEADERS.visitantes.length) {
    return null;
  }
  const expected = [...SHEET_HEADERS.visitantes];
  const isCompatible = actual.every((header, index) => {
    const canonical = expected[index];
    return header === canonical || visitorHeaderAliases[canonical]?.includes(String(header));
  });
  if (!isCompatible || actual.every((header, index) => header === expected[index])) {
    return null;
  }
  return {
    startIndex: headerIndex("visitantes", "descricao"),
    headers: expected.slice(
      headerIndex("visitantes", "descricao"),
      headerIndex("visitantes", "como_chegou_a_na") + 1,
    ),
  };
}

function migratableMissingColumns(
  sheet: SheetName,
  actual: unknown[],
): { columns: string[]; insertIndex: number } | null {
  if (sheet === "atas") {
    const expectedWithoutAtaIdentifierColumns = SHEET_HEADERS.atas.filter(
      (header) => !ataIdentifierColumnSet.has(header),
    );
    if (isHeaderPrefix(actual, expectedWithoutAtaIdentifierColumns)) {
      return {
        columns: [...ataIdentifierColumns],
        insertIndex: headerIndex("atas", ataIdentifierColumns[0]),
      };
    }

    const newAtaColumns = ["duracao", "formato_outros"];
    const expectedWithoutNewAtaColumns = SHEET_HEADERS.atas.filter(
      (header) => !newAtaColumns.includes(header),
    );
    if (isHeaderPrefix(actual, expectedWithoutNewAtaColumns)) {
      return {
        columns: newAtaColumns,
        insertIndex: headerIndex("atas", newAtaColumns[0]),
      };
    }

    const expectedWithoutPreenchidoPor = SHEET_HEADERS.atas.filter(
      (header) => header !== "preenchido_por",
    );
    if (isHeaderPrefix(actual, expectedWithoutPreenchidoPor)) {
      return {
        columns: ["preenchido_por"],
        insertIndex: headerIndex("atas", "preenchido_por"),
      };
    }

    const expectedWithoutTotalPartilhas = SHEET_HEADERS.atas.filter(
      (header) => header !== "total_partilhas",
    );
    if (isHeaderPrefix(actual, expectedWithoutTotalPartilhas)) {
      return {
        columns: ["total_partilhas"],
        insertIndex: headerIndex("atas", "total_partilhas"),
      };
    }
  }

  if (sheet === "trocas_chaveiro") {
    const expectedWithoutQuantidade = SHEET_HEADERS.trocas_chaveiro.filter(
      (header) => header !== "quantidade",
    );
    if (isHeaderPrefix(actual, expectedWithoutQuantidade)) {
      return {
        columns: ["quantidade"],
        insertIndex: headerIndex("trocas_chaveiro", "quantidade"),
      };
    }
  }

  if (sheet === "ingressos") {
    const expectedWithoutCidade = SHEET_HEADERS.ingressos.filter(
      (header) => header !== "cidade",
    );
    if (isHeaderPrefix(actual, expectedWithoutCidade)) {
      return {
        columns: ["cidade"],
        insertIndex: headerIndex("ingressos", "cidade"),
      };
    }
  }

  if (sheet === "grupos") {
    const firstGroupAccessColumn = "responsavel_grupo_nome";
    const newGroupColumns = [
      firstGroupAccessColumn,
      "responsavel_grupo_email",
      "email_acesso_grupo",
      "responsaveis_ata",
      "link_formulario_ata",
      "ultima_reuniao_anterior",
    ];
    const expectedWithoutNewGroupColumns = SHEET_HEADERS.grupos.filter(
      (header) => !newGroupColumns.includes(header),
    );
    if (isHeaderPrefix(actual, expectedWithoutNewGroupColumns)) {
      return {
        columns: newGroupColumns,
        insertIndex: headerIndex("grupos", firstGroupAccessColumn),
      };
    }

    const expectedWithoutUltimaReuniao = SHEET_HEADERS.grupos.filter(
      (header) => header !== "ultima_reuniao_anterior",
    );
    if (isHeaderPrefix(actual, expectedWithoutUltimaReuniao)) {
      return {
        columns: ["ultima_reuniao_anterior"],
        insertIndex: headerIndex("grupos", "ultima_reuniao_anterior"),
      };
    }
  }

  if (sheet === "servidores") {
    const expectedWithoutFuncao = SHEET_HEADERS.servidores.filter(
      (header) => header !== "funcao",
    );
    if (isHeaderPrefix(actual, expectedWithoutFuncao)) {
      return {
        columns: ["funcao"],
        insertIndex: headerIndex("servidores", "funcao"),
      };
    }
  }

  const expected = SHEET_HEADERS[sheet];
  if (
    actual.length < expected.length &&
    actual.every((header, index) => header === expected[index])
  ) {
    return {
      columns: [...expected.slice(actual.length)],
      insertIndex: actual.length,
    };
  }

  return null;
}

function isMissingSheetRangeError(error: unknown, sheet: SheetName) {
  return (
    error instanceof Error &&
    error.message.includes(`Unable to parse range: ${sheet}!`)
  );
}

function headerCells(headers: readonly string[]): sheets_v4.Schema$CellData[] {
  return headers.map((header) => ({
    userEnteredValue: { stringValue: header },
  }));
}

function nextSheetId(sheets: SheetSnapshot[]) {
  const existingIds = sheets
    .map((sheet) => sheet.properties?.sheetId)
    .filter((sheetId): sheetId is number => Number.isInteger(sheetId));
  return Math.max(0, ...existingIds) + 1;
}

function atasValidationRequests(
  sheetId: number,
  rowCount: number,
): sheets_v4.Schema$Request[] {
  const listValidation = (
    startColumnIndex: number,
    values: string[],
  ): sheets_v4.Schema$Request => ({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 1,
        endRowIndex: rowCount,
        startColumnIndex,
        endColumnIndex: startColumnIndex + 1,
      },
      cell: {
        dataValidation: {
          condition: {
            type: "ONE_OF_LIST",
            values: values.map((userEnteredValue) => ({ userEnteredValue })),
          },
          strict: true,
          showCustomUi: true,
        },
      },
      fields: "dataValidation",
    },
  });
  const numberValidation = (
    startColumnIndex: number,
  ): sheets_v4.Schema$Request => ({
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 1,
        endRowIndex: rowCount,
        startColumnIndex,
        endColumnIndex: startColumnIndex + 1,
      },
      cell: {
        dataValidation: {
          condition: {
            type: "NUMBER_GREATER_THAN_EQ",
            values: [{ userEnteredValue: "1" }],
          },
          strict: true,
        },
      },
      fields: "dataValidation",
    },
  });

  return [
    numberValidation(SHEET_HEADERS.atas.indexOf("numero_sequencial_grupo")),
    numberValidation(SHEET_HEADERS.atas.indexOf("indice_personalizado_grupo")),
    listValidation(SHEET_HEADERS.atas.indexOf("plataforma"), ["Zoom"]),
    listValidation(SHEET_HEADERS.atas.indexOf("tipo_reuniao"), ["Aberta", "Fechada"]),
  ];
}

function cellText(value: unknown) {
  if (value === null || typeof value === "undefined" || value === false) {
    return "";
  }
  return String(value).trim();
}

function rowIsBlank(row: unknown[]) {
  return row.every((cell) => cellText(cell) === "");
}

function rowObject(headers: unknown[], row: unknown[]) {
  return Object.fromEntries(
    headers.map((header, index) => [String(header), row[index] ?? ""]),
  );
}

function migrationSortValue(value: unknown) {
  if (typeof value === "number") return String(value).padStart(12, "0");
  return cellText(value);
}

function migratedAtaIdentifierRows(
  actualHeaders: unknown[],
  values: unknown[][],
) {
  const rows = values.slice(1).map((row, index) => ({
    row,
    rowNumber: index + 2,
    object: rowObject(actualHeaders, row),
  }));
  const dataRows = rows.filter(({ row }) => !rowIsBlank(row));
  const grouped = new Map<string, typeof dataRows>();

  for (const row of dataRows) {
    const ataId = cellText(row.object.ata_id);
    const grupoId = cellText(row.object.grupo_id);
    if (!ataId || !grupoId) {
      throw new Error(
        `Não foi possível migrar identificadores da ata na linha ${row.rowNumber}: ata_id e grupo_id são obrigatórios.`,
      );
    }
    const current = grouped.get(grupoId) ?? [];
    current.push(row);
    grouped.set(grupoId, current);
  }

  const byRowNumber = new Map<number, number>();
  for (const groupRows of grouped.values()) {
    groupRows
      .sort(
        (first, second) =>
          migrationSortValue(first.object.created_at).localeCompare(
            migrationSortValue(second.object.created_at),
          ) ||
          migrationSortValue(first.object.data_reuniao).localeCompare(
            migrationSortValue(second.object.data_reuniao),
          ) ||
          migrationSortValue(first.object.hora_inicio).localeCompare(
            migrationSortValue(second.object.hora_inicio),
          ) ||
          first.rowNumber - second.rowNumber,
      )
      .forEach((row, index) => byRowNumber.set(row.rowNumber, index + 1));
  }

  return rows.map(({ rowNumber }) => {
    const number = byRowNumber.get(rowNumber);
    return {
      values: ataIdentifierColumns.map(() =>
        number
          ? { userEnteredValue: { numberValue: number } }
          : { userEnteredValue: { stringValue: "" } },
      ),
    };
  });
}

function parsePositiveIdentifier(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const number = Number(value);
    if (Number.isInteger(number) && number >= 1) return number;
  }
  return null;
}

function assertValidExistingAtaIdentifiers(
  actualHeaders: unknown[],
  values: unknown[][],
) {
  const rows = values.slice(1).map((row, index) => ({
    row,
    rowNumber: index + 2,
    object: rowObject(actualHeaders, row),
  }));
  const sequenceKeys = new Set<string>();
  const customIndexKeys = new Set<string>();

  for (const { row, rowNumber, object } of rows) {
    if (rowIsBlank(row)) continue;
    const ataId = cellText(object.ata_id);
    const grupoId = cellText(object.grupo_id);
    if (!ataId || !grupoId) {
      throw new Error(
        `Identificadores de ata inválidos na linha ${rowNumber}: ata_id e grupo_id são obrigatórios.`,
      );
    }

    const sequence = parsePositiveIdentifier(object.numero_sequencial_grupo);
    if (sequence == null) {
      throw new Error(
        `Identificadores de ata inválidos na linha ${rowNumber}: numero_sequencial_grupo deve ser um inteiro positivo.`,
      );
    }
    const customIndex = parsePositiveIdentifier(
      object.indice_personalizado_grupo,
    );
    if (customIndex == null) {
      throw new Error(
        `Identificadores de ata inválidos na linha ${rowNumber}: indice_personalizado_grupo deve ser um inteiro positivo.`,
      );
    }

    const sequenceKey = `${grupoId}|${sequence}`;
    if (sequenceKeys.has(sequenceKey)) {
      throw new Error(
        `Identificadores de ata inválidos na linha ${rowNumber}: numero_sequencial_grupo duplicado para o mesmo grupo.`,
      );
    }
    sequenceKeys.add(sequenceKey);

    const customIndexKey = `${grupoId}|${customIndex}`;
    if (customIndexKeys.has(customIndexKey)) {
      throw new Error(
        `Identificadores de ata inválidos na linha ${rowNumber}: indice_personalizado_grupo duplicado para o mesmo grupo.`,
      );
    }
    customIndexKeys.add(customIndexKey);
  }
}

async function readSheetValues(
  client: ContractReconciliationClient,
  spreadsheetId: string,
  sheet: SheetName,
) {
  const response = await client.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheet}!A:Z`,
  });
  return response.data.values ?? [];
}

function gruposAccessColumnCleanupRequests(
  sheetId: number,
  rowCount: number,
): sheets_v4.Schema$Request[] {
  const startColumnIndex = SHEET_HEADERS.grupos.indexOf(
    "responsavel_grupo_nome",
  );
  const endColumnIndex =
    SHEET_HEADERS.grupos.indexOf("link_formulario_ata") + 1;
  return [
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: rowCount,
          startColumnIndex,
          endColumnIndex,
        },
        cell: {},
        fields: "dataValidation",
      },
    },
  ];
}

function atasFreeTextColumnCleanupRequests(
  sheetId: number,
  rowCount: number,
): sheets_v4.Schema$Request[] {
  const startColumnIndex = SHEET_HEADERS.atas.indexOf("duracao");
  const endColumnIndex = SHEET_HEADERS.atas.indexOf("preenchido_por") + 1;
  return [
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: rowCount,
          startColumnIndex,
          endColumnIndex,
        },
        cell: {},
        fields: "dataValidation",
      },
    },
  ];
}

function visitantesValidationRequests(
  sheetId: number,
  rowCount: number,
): sheets_v4.Schema$Request[] {
  const listValidation = (column: "descricao" | "como_chegou_a_na", values: string[]): sheets_v4.Schema$Request => {
    const startColumnIndex = SHEET_HEADERS.visitantes.indexOf(column);
    return {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: rowCount,
          startColumnIndex,
          endColumnIndex: startColumnIndex + 1,
        },
        cell: {
          dataValidation: {
            condition: {
              type: "ONE_OF_LIST",
              values: values.map((userEnteredValue) => ({ userEnteredValue })),
            },
            strict: true,
            showCustomUi: true,
          },
        },
        fields: "dataValidation",
      },
    };
  };
  return [
    listValidation("descricao", [...categoriaVisitanteMapping.labels]),
    listValidation("como_chegou_a_na", [...origemContatoMapping.labels]),
  ];
}

function trocasChaveiroValidationRequests(
  sheetId: number,
  rowCount: number,
): sheets_v4.Schema$Request[] {
  return [
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: rowCount,
          startColumnIndex: 2,
          endColumnIndex: 3,
        },
        cell: {
          dataValidation: {
            condition: {
              type: "ONE_OF_LIST",
              values: tempoLimpoMapping.labels.map((userEnteredValue) => ({
                userEnteredValue,
              })),
            },
            strict: true,
            showCustomUi: true,
          },
        },
        fields: "dataValidation",
      },
    },
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: rowCount,
          startColumnIndex: 3,
          endColumnIndex: 4,
        },
        cell: {
          dataValidation: {
            condition: {
              type: "NUMBER_GREATER_THAN_EQ",
              values: [
                {
                  userEnteredValue: "1",
                },
              ],
            },
            strict: true,
          },
        },
        fields: "dataValidation",
      },
    },
  ];
}

async function readMetadata(
  client: ContractReconciliationClient,
  spreadsheetId: string,
) {
  const response = await client.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title,gridProperties(rowCount)))",
  });
  return response.data.sheets ?? [];
}

async function readHeader(
  client: ContractReconciliationClient,
  spreadsheetId: string,
  sheet: SheetName,
) {
  const response = await client.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheet}!1:1`,
  });
  return response.data.values?.[0] ?? [];
}

export async function reconcileSheetContract(
  client: ContractReconciliationClient,
  spreadsheetId: string,
): Promise<ContractReconciliationResult> {
  const metadata = await readMetadata(client, spreadsheetId);
  const byName = new Map(
    metadata.flatMap((sheet) => {
      const title = sheet.properties?.title;
      return title ? [[title, sheet] as const] : [];
    }),
  );
  const missing = sheetNames.filter((name) => !byName.has(name));
  const notCreatable = missing.filter((name) => !autoCreatableSheets.has(name));

  if (notCreatable.length > 0) {
    throw new Error(`Abas ausentes no Sheets: ${notCreatable.join(", ")}.`);
  }

  const requests: sheets_v4.Schema$Request[] = [];
  const createdSheets: SheetName[] = [];
  const addedColumns: Array<{ sheet: SheetName; column: string }> = [];
  const renamedSheets = new Set<SheetName>();

  for (const name of sheetNames) {
    if (!byName.has(name)) continue;
    const actual = await readHeader(client, spreadsheetId, name);
    if (JSON.stringify(actual) === JSON.stringify([...SHEET_HEADERS[name]])) {
      if (name === "atas") {
        const values = await readSheetValues(client, spreadsheetId, "atas");
        assertValidExistingAtaIdentifiers(actual, values);
      }
      continue;
    }

    const sheetId = byName.get(name)?.properties?.sheetId;
    const renamedHeaders = migratableRenamedHeaders(name, actual);
    if (renamedHeaders && Number.isInteger(sheetId) && sheetId != null) {
      requests.push({
        updateCells: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: renamedHeaders.startIndex,
            endColumnIndex:
              renamedHeaders.startIndex + renamedHeaders.headers.length,
          },
          rows: [{ values: headerCells(renamedHeaders.headers) }],
          fields: "userEnteredValue",
        },
      });
      renamedSheets.add(name);
      continue;
    }

    const migration = migratableMissingColumns(name, actual);
    if (!migration || !Number.isInteger(sheetId) || sheetId == null) {
      assertHeader(name, actual);
      continue;
    }

    requests.push({
      insertDimension: {
        range: {
          sheetId,
          dimension: "COLUMNS",
          startIndex: migration.insertIndex,
          endIndex: migration.insertIndex + migration.columns.length,
        },
        inheritFromBefore: true,
      },
    });
    requests.push({
      updateCells: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: migration.insertIndex,
          endColumnIndex: migration.insertIndex + migration.columns.length,
        },
        rows: [
          {
            values: migration.columns.map((column) => ({
              userEnteredValue: { stringValue: column },
            })),
          },
        ],
        fields: "userEnteredValue",
      },
    });
    if (
      name === "atas" &&
      migration.columns.every((column) => ataIdentifierColumnSet.has(column))
    ) {
      const values = await readSheetValues(client, spreadsheetId, "atas");
      const migratedRows = migratedAtaIdentifierRows(actual, values);
      if (migratedRows.length > 0) {
        requests.push({
          updateCells: {
            range: {
              sheetId,
              startRowIndex: 1,
              endRowIndex: 1 + migratedRows.length,
              startColumnIndex: migration.insertIndex,
              endColumnIndex:
                migration.insertIndex + ataIdentifierColumns.length,
            },
            rows: migratedRows,
            fields: "userEnteredValue",
          },
        });
      }
    }
    addedColumns.push(
      ...migration.columns.map((column) => ({ sheet: name, column })),
    );
  }

  let nextId = nextSheetId(metadata);

  for (const name of missing) {
    const sheetId = nextId++;
    createdSheets.push(name);
    requests.push({
      addSheet: {
        properties: {
          sheetId,
          title: name,
          gridProperties: {
            rowCount: 1000,
            columnCount: SHEET_HEADERS[name].length,
            frozenRowCount: 1,
          },
        },
      },
    });
    requests.push({
      updateCells: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
        rows: [{ values: headerCells(SHEET_HEADERS[name]) }],
        fields: "userEnteredValue",
      },
    });
  }

  const atasSheetId = byName.get("atas")?.properties?.sheetId;
  const atasRowCount = byName.get("atas")?.properties?.gridProperties?.rowCount;
  if (!Number.isInteger(atasSheetId) || atasSheetId == null) {
    throw new Error("ID da aba atas não encontrado ou inválido.");
  }
  requests.push(
    ...atasFreeTextColumnCleanupRequests(atasSheetId, atasRowCount ?? 1000),
  );
  requests.push(...atasValidationRequests(atasSheetId, atasRowCount ?? 1000));

  const gruposSheetId = byName.get("grupos")?.properties?.sheetId;
  const gruposRowCount = byName.get("grupos")?.properties?.gridProperties?.rowCount;
  if (!Number.isInteger(gruposSheetId) || gruposSheetId == null) {
    throw new Error("ID da aba grupos não encontrado ou inválido.");
  }
  requests.push(
    ...gruposAccessColumnCleanupRequests(gruposSheetId, gruposRowCount ?? 1000),
  );

  const visitantesSheetId = byName.get("visitantes")?.properties?.sheetId;
  const visitantesRowCount =
    byName.get("visitantes")?.properties?.gridProperties?.rowCount;
  if (!Number.isInteger(visitantesSheetId) || visitantesSheetId == null) {
    throw new Error("ID da aba visitantes não encontrado ou inválido.");
  }
  requests.push(
    ...visitantesValidationRequests(visitantesSheetId, visitantesRowCount ?? 1000),
  );

  const trocasChaveiroSheetId = byName.get("trocas_chaveiro")?.properties?.sheetId;
  const trocasChaveiroRowCount =
    byName.get("trocas_chaveiro")?.properties?.gridProperties?.rowCount;
  if (
    !Number.isInteger(trocasChaveiroSheetId) ||
    trocasChaveiroSheetId == null
  ) {
    throw new Error("ID da aba trocas_chaveiro não encontrado ou inválido.");
  }
  requests.push(
    ...trocasChaveiroValidationRequests(
      trocasChaveiroSheetId,
      trocasChaveiroRowCount ?? 1000,
    ),
  );

  if (requests.length > 0) {
    await client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }

  for (const name of [...createdSheets, ...addedColumns.map((item) => item.sheet), ...renamedSheets]) {
    try {
      const actual = await readHeader(client, spreadsheetId, name);
      assertHeader(name, actual);
    } catch (error) {
      if (isMissingSheetRangeError(error, name)) {
        throw new Error(`Aba ${name} não foi criada.`);
      }
      throw error;
    }
  }

  return {
    createdSheets,
    addedColumns,
    validatedSheets: sheetNames,
    requestCount: requests.length,
  };
}
