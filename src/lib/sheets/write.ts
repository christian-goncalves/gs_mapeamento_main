import type { sheets_v4 } from "@googleapis/sheets";
import type { AtaCompleta } from "@/domain/rules";
import { SHEET_HEADERS, type SheetName } from "./contract";
import {
  domainAtaToSheet,
  domainIngressoToSheet,
  domainParticipacaoToSheet,
  domainServidorToSheet,
  domainTrocaChaveiroToSheet,
  domainVisitanteToSheet,
} from "./schemas";

type SheetIds = Record<SheetName, number>;
type SheetValue = string | number | boolean;
type RecordSheetName = Exclude<
  SheetName,
  "grupos" | "usuarios_grupo" | "grupo_horarios" | "grupo_servidores_mesa"
>;
type NextRows = Record<RecordSheetName, number>;

function dateSerial(date: string) {
  return Date.parse(`${date}T00:00:00.000Z`) / 86_400_000 + 25569;
}

function extendedValue(value: SheetValue): sheets_v4.Schema$ExtendedValue {
  if (typeof value === "boolean") return { boolValue: value };
  if (typeof value === "number") return { numberValue: value };
  return { stringValue: value };
}

function rowData(
  sheet: SheetName,
  row: Record<string, SheetValue>,
): sheets_v4.Schema$RowData {
  return {
    values: SHEET_HEADERS[sheet].map((header) => {
      const value =
        sheet === "atas" && header === "data_reuniao"
          ? dateSerial(String(row[header]))
          : row[header];
      return { userEnteredValue: extendedValue(value) };
    }),
  };
}

export function firstEmptyDataRowNumber(values: unknown[][]) {
  const [, ...rows] = values;
  const emptyIndex = rows.findIndex((row) => {
    const id = row[0];
    return id === "" || id === null || typeof id === "undefined";
  });
  if (emptyIndex >= 0) return emptyIndex + 2;
  return values.length + 1;
}

export function buildAtomicWriteRequests(
  registro: AtaCompleta,
  sheetIds: SheetIds,
  nextRows: NextRows,
): sheets_v4.Schema$Request[] {
  return buildMonthlyAtomicWriteRequests([registro], sheetIds, nextRows);
}

export function buildMonthlyAtomicWriteRequests(
  registros: readonly AtaCompleta[],
  sheetIds: SheetIds,
  nextRows: NextRows,
): sheets_v4.Schema$Request[] {
  const rows = {
    atas: registros.map((registro) => domainAtaToSheet(registro.ata)),
    servidores: registros.flatMap((registro) =>
      registro.servidores.map(domainServidorToSheet),
    ),
    participacao: registros.flatMap((registro) =>
      registro.participacao.map(domainParticipacaoToSheet),
    ),
    visitantes: registros.flatMap((registro) =>
      registro.visitantes.map(domainVisitanteToSheet),
    ),
    ingressos: registros.flatMap((registro) =>
      registro.ingressos.map(domainIngressoToSheet),
    ),
    trocas_chaveiro: registros.flatMap((registro) =>
      registro.trocas_chaveiro.map(domainTrocaChaveiroToSheet),
    ),
  };

  return (Object.entries(rows) as [
    RecordSheetName,
    object[],
  ][])
    .filter(([, items]) => items.length > 0)
    .map(([sheet, items]) => ({
      updateCells: {
        range: {
          sheetId: sheetIds[sheet],
          startRowIndex: nextRows[sheet] - 1,
          endRowIndex: nextRows[sheet] - 1 + items.length,
          startColumnIndex: 0,
          endColumnIndex: SHEET_HEADERS[sheet].length,
        },
        rows: items.map((item) =>
          rowData(sheet, item as Record<string, SheetValue>),
        ),
        fields: "userEnteredValue",
      },
    }));
}

export type BatchUpdateClient = {
  spreadsheets: {
    batchUpdate: (request: {
      spreadsheetId: string;
      requestBody: { requests: sheets_v4.Schema$Request[] };
    }) => Promise<unknown>;
  };
};

export async function executeAtomicBatch(
  client: BatchUpdateClient,
  spreadsheetId: string,
  requests: sheets_v4.Schema$Request[],
) {
  if (requests.length === 0) throw new Error("Lote de escrita vazio.");
  await client.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  });
}
