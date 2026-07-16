import type { sheets_v4 } from "googleapis";

import { tempoLimpoMapping } from "@/domain/enums";
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

function migratableMissingColumns(
  sheet: SheetName,
  actual: unknown[],
): { columns: string[]; insertIndex: number } | null {
  if (sheet === "atas") {
    const newAtaColumns = ["duracao", "formato_outros"];
    const expectedWithoutNewAtaColumns = SHEET_HEADERS.atas.filter(
      (header) => !newAtaColumns.includes(header),
    );
    if (isHeaderPrefix(actual, expectedWithoutNewAtaColumns)) {
      return {
        columns: newAtaColumns,
        insertIndex: SHEET_HEADERS.atas.indexOf(newAtaColumns[0]),
      };
    }

    const expectedWithoutPreenchidoPor = SHEET_HEADERS.atas.filter(
      (header) => header !== "preenchido_por",
    );
    if (isHeaderPrefix(actual, expectedWithoutPreenchidoPor)) {
      return {
        columns: ["preenchido_por"],
        insertIndex: SHEET_HEADERS.atas.indexOf("preenchido_por"),
      };
    }

    const expectedWithoutTotalPartilhas = SHEET_HEADERS.atas.filter(
      (header) => header !== "total_partilhas",
    );
    if (isHeaderPrefix(actual, expectedWithoutTotalPartilhas)) {
      return {
        columns: ["total_partilhas"],
        insertIndex: SHEET_HEADERS.atas.indexOf("total_partilhas"),
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
        insertIndex: SHEET_HEADERS.trocas_chaveiro.indexOf("quantidade"),
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
        insertIndex: SHEET_HEADERS.ingressos.indexOf("cidade"),
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
        insertIndex: SHEET_HEADERS.grupos.indexOf(firstGroupAccessColumn),
      };
    }

    const expectedWithoutUltimaReuniao = SHEET_HEADERS.grupos.filter(
      (header) => header !== "ultima_reuniao_anterior",
    );
    if (isHeaderPrefix(actual, expectedWithoutUltimaReuniao)) {
      return {
        columns: ["ultima_reuniao_anterior"],
        insertIndex: SHEET_HEADERS.grupos.indexOf("ultima_reuniao_anterior"),
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
        insertIndex: SHEET_HEADERS.servidores.indexOf("funcao"),
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

  return [
    listValidation(SHEET_HEADERS.atas.indexOf("plataforma"), ["Zoom"]),
    listValidation(SHEET_HEADERS.atas.indexOf("tipo_reuniao"), ["Aberta", "Fechada"]),
  ];
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
              values: tempoLimpoMapping.codes.map((userEnteredValue) => ({
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

  for (const name of sheetNames) {
    if (!byName.has(name)) continue;
    const actual = await readHeader(client, spreadsheetId, name);
    if (JSON.stringify(actual) === JSON.stringify([...SHEET_HEADERS[name]])) {
      continue;
    }

    const migration = migratableMissingColumns(name, actual);
    const sheetId = byName.get(name)?.properties?.sheetId;
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
  requests.push(...atasValidationRequests(atasSheetId, atasRowCount ?? 1000));

  const gruposSheetId = byName.get("grupos")?.properties?.sheetId;
  const gruposRowCount = byName.get("grupos")?.properties?.gridProperties?.rowCount;
  if (!Number.isInteger(gruposSheetId) || gruposSheetId == null) {
    throw new Error("ID da aba grupos não encontrado ou inválido.");
  }
  requests.push(
    ...gruposAccessColumnCleanupRequests(gruposSheetId, gruposRowCount ?? 1000),
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

  for (const name of [...createdSheets, ...addedColumns.map((item) => item.sheet)]) {
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
