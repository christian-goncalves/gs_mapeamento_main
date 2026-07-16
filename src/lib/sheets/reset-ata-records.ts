import type { sheets_v4 } from "googleapis";
import { SHEET_HEADERS, type SheetName } from "./contract";

export const ATA_RECORD_SHEETS = [
  "atas",
  "servidores",
  "participacao",
  "visitantes",
  "trocas_chaveiro",
  "ingressos",
] as const satisfies readonly SheetName[];

export type AtaRecordSheet = (typeof ATA_RECORD_SHEETS)[number];

export type ResetSheetMetadata = {
  title: string;
  sheetId: number;
  rowCount: number;
};

export function isAtaRecordSheet(sheet: string): sheet is AtaRecordSheet {
  return ATA_RECORD_SHEETS.includes(sheet as AtaRecordSheet);
}

export function assertAtaRecordHeaders(
  headersBySheet: Partial<Record<AtaRecordSheet, unknown[]>>,
) {
  for (const sheet of ATA_RECORD_SHEETS) {
    const actual = headersBySheet[sheet];
    const expected = SHEET_HEADERS[sheet];
    if (!actual) throw new Error(`Cabeçalho ausente em ${sheet}.`);
    if (JSON.stringify(actual) !== JSON.stringify([...expected])) {
      throw new Error(
        `Cabeçalho inválido em ${sheet}. Esperado: ${expected.join(", ")}. Recebido: ${actual.join(", ")}.`,
      );
    }
  }
}

export function buildClearAtaRecordRequests(
  metadata: ResetSheetMetadata[],
): sheets_v4.Schema$Request[] {
  const targets = new Map(
    metadata
      .filter((sheet) => isAtaRecordSheet(sheet.title))
      .map((sheet) => [sheet.title, sheet] as const),
  );

  for (const sheet of ATA_RECORD_SHEETS) {
    if (!targets.has(sheet)) {
      throw new Error(`Aba obrigatória ausente: ${sheet}.`);
    }
  }

  const requests = ATA_RECORD_SHEETS.flatMap((sheet) => {
    const target = targets.get(sheet);
    if (!target || target.rowCount <= 1) return [];
    return [
      {
        repeatCell: {
          range: {
            sheetId: target.sheetId,
            startRowIndex: 1,
            endRowIndex: target.rowCount,
            startColumnIndex: 0,
            endColumnIndex: SHEET_HEADERS[sheet].length,
          },
          cell: {},
          fields: "userEnteredValue",
        },
      } satisfies sheets_v4.Schema$Request,
    ];
  });

  const allowedSheetIds = new Set(
    ATA_RECORD_SHEETS.map((sheet) => targets.get(sheet)?.sheetId),
  );
  for (const request of requests) {
    const sheetId = request.repeatCell?.range?.sheetId;
    if (!allowedSheetIds.has(sheetId)) {
      throw new Error("Reset abortado: request gerado para aba fora da lista permitida.");
    }
    if (request.repeatCell?.fields !== "userEnteredValue") {
      throw new Error("Reset abortado: request tentaria alterar campos além de userEnteredValue.");
    }
  }

  return requests;
}
