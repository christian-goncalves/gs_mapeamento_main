import { google, type sheets_v4 } from "googleapis";
import { SHEET_HEADERS } from "../src/lib/sheets/contract";
import {
  ATA_RECORD_SHEETS,
  assertAtaRecordHeaders,
  buildClearAtaRecordRequests,
  type AtaRecordSheet,
  type ResetSheetMetadata,
} from "../src/lib/sheets/reset-ata-records";

type ValidationCheck = {
  sheet: AtaRecordSheet;
  column: string;
};

const validationChecks: ValidationCheck[] = [
  ...[
    "hora_inicio",
    "preenchido_por",
    "plataforma",
    "tipo_reuniao",
    "formato_partilha",
    "formato_estudo",
    "formato_tematico",
    "formato_literatura",
    "formato_passos",
    "formato_tradicoes",
  ].map((column) => ({ sheet: "atas" as const, column })),
  { sheet: "visitantes", column: "categoria" },
  { sheet: "visitantes", column: "origem_contato" },
  { sheet: "trocas_chaveiro", column: "tempo_limpo" },
];

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}.`);
  return value;
}

function columnLetter(index: number) {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function metadataFromResponse(
  response: sheets_v4.Schema$Spreadsheet,
): ResetSheetMetadata[] {
  return (response.sheets ?? []).flatMap((sheet) => {
    const title = sheet.properties?.title;
    const sheetId = sheet.properties?.sheetId;
    const rowCount = sheet.properties?.gridProperties?.rowCount;
    if (!title || typeof sheetId !== "number") return [];
    return [{ title, sheetId, rowCount: rowCount ?? 1 }];
  });
}

async function readMetadata(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title,gridProperties(rowCount)))",
  });
  return metadataFromResponse(response.data);
}

async function readHeaders(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
) {
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: ATA_RECORD_SHEETS.map((sheet) => `${sheet}!1:1`),
  });
  return Object.fromEntries(
    ATA_RECORD_SHEETS.map((sheet, index) => [
      sheet,
      response.data.valueRanges?.[index]?.values?.[0] ?? [],
    ]),
  ) as Partial<Record<AtaRecordSheet, unknown[]>>;
}

async function readIdColumnCounts(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
) {
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: ATA_RECORD_SHEETS.map((sheet) => `${sheet}!A2:A`),
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  return Object.fromEntries(
    ATA_RECORD_SHEETS.map((sheet, index) => [
      sheet,
      (response.data.valueRanges?.[index]?.values ?? []).filter((row) => {
        const value = row[0];
        return value !== "" && value !== null && typeof value !== "undefined";
      }).length,
    ]),
  );
}

function validationRanges(metadata: ResetSheetMetadata[]) {
  const rowCountBySheet = new Map(metadata.map((sheet) => [sheet.title, sheet.rowCount]));
  return validationChecks.map(({ sheet, column }) => {
    const columnIndex = SHEET_HEADERS[sheet].indexOf(column);
    if (columnIndex < 0) throw new Error(`Coluna ${column} não encontrada em ${sheet}.`);
    const endRow = Math.max(2, Math.min(rowCountBySheet.get(sheet) ?? 30, 30));
    const letter = columnLetter(columnIndex);
    return `${sheet}!${letter}2:${letter}${endRow}`;
  });
}

async function readValidationSnapshot(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  metadata: ResetSheetMetadata[],
) {
  const ranges = validationRanges(metadata);
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    includeGridData: true,
    ranges,
    fields: "sheets(properties(title),data(rowData(values(dataValidation))))",
  });
  const counts = new Map<string, number>();
  for (const sheet of response.data.sheets ?? []) {
    const title = sheet.properties?.title;
    if (!title) continue;
    for (const data of sheet.data ?? []) {
      const count = (data.rowData ?? []).reduce(
        (total, row) =>
          total + (row.values ?? []).filter((cell) => cell.dataValidation).length,
        0,
      );
      counts.set(title, (counts.get(title) ?? 0) + count);
    }
  }
  return Object.fromEntries(counts);
}

async function main() {
  const execute = process.argv.includes("--execute");
  const auth = new google.auth.JWT({
    email: required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: required("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = required("GOOGLE_SHEETS_ID");

  const metadata = await readMetadata(sheets, spreadsheetId);
  const headers = await readHeaders(sheets, spreadsheetId);
  assertAtaRecordHeaders(headers);

  const idValuesBefore = await readIdColumnCounts(sheets, spreadsheetId);
  const beforeValidation = await readValidationSnapshot(sheets, spreadsheetId, metadata);
  const requests = buildClearAtaRecordRequests(metadata);

  console.log(
    JSON.stringify(
      {
        mode: execute ? "execute" : "dry-run",
        targetSheets: ATA_RECORD_SHEETS,
        requestCount: requests.length,
        ranges: requests.map((request) => request.repeatCell?.range),
        idValuesBefore,
        validationBefore: beforeValidation,
      },
      null,
      2,
    ),
  );

  if (!execute) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  });
  const idValuesAfter = await readIdColumnCounts(sheets, spreadsheetId);
  const afterValidation = await readValidationSnapshot(sheets, spreadsheetId, metadata);
  console.log(
    JSON.stringify(
      {
        mode: "execute",
        applied: true,
        idValuesAfter,
        validationAfter: afterValidation,
        validationPreserved:
          JSON.stringify(beforeValidation) === JSON.stringify(afterValidation),
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
