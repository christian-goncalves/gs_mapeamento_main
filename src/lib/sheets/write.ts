import type { sheets_v4 } from "googleapis";
import type { AtaCompleta } from "@/domain/rules";
import { SHEET_HEADERS, type SheetName } from "./contract";
import {
  domainAtaToSheet,
  domainParticipacaoToSheet,
  domainServidorToSheet,
  domainTrocaChaveiroToSheet,
  domainVisitanteToSheet,
} from "./schemas";

type SheetIds = Record<SheetName, number>;
type SheetValue = string | number | boolean;

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

export function buildAtomicAppendRequests(
  registro: AtaCompleta,
  sheetIds: SheetIds,
): sheets_v4.Schema$Request[] {
  const rows = {
    atas: [domainAtaToSheet(registro.ata)],
    servidores: registro.servidores.map(domainServidorToSheet),
    participacao: registro.participacao.map(domainParticipacaoToSheet),
    visitantes: registro.visitantes.map(domainVisitanteToSheet),
    trocas_chaveiro: registro.trocas_chaveiro.map(
      domainTrocaChaveiroToSheet,
    ),
  };

  return (Object.entries(rows) as [Exclude<SheetName, "grupos">, object[]][])
    .filter(([, items]) => items.length > 0)
    .map(([sheet, items]) => ({
      appendCells: {
        sheetId: sheetIds[sheet],
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
