import "server-only";

import type { AtaSubmission } from "@/domain/form-schemas";
import { assertCreationAllowed, type AtaBusinessKey } from "@/domain/creation";
import { materializeAtaSubmission } from "@/domain/submission";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { SHEET_HEADERS, type SheetName } from "./contract";
import { parseRows, rowsToObjects, type SheetCell } from "./rows";
import {
  sheetAtaBusinessKeySchema,
  sheetGrupoSchema,
  sheetGrupoToDomain,
} from "./schemas";
import {
  buildAtomicWriteRequests,
  executeAtomicBatch,
  firstEmptyDataRowNumber,
} from "./write";

export async function createAtaInSheets(submission: AtaSubmission) {
  const spreadsheetId = getSpreadsheetId();
  const sheets = getSheetsClient();
  const names = Object.keys(SHEET_HEADERS) as SheetName[];
  const [valuesResponse, metadataResponse] = await Promise.all([
    sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: names.map((name) => `${name}!A:Z`),
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "SERIAL_NUMBER",
    }),
    sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets(properties(sheetId,title))",
    }),
  ]);

  const sheetValues = Object.fromEntries(
    names.map((name, index) => [
      name,
      (valuesResponse.data.valueRanges?.[index]?.values as
        | SheetCell[][]
        | undefined) ?? [],
    ]),
  ) as Record<SheetName, SheetCell[][]>;

  const rows = Object.fromEntries(
    names.map((name) => [
      name,
      rowsToObjects(
        SHEET_HEADERS[name],
        sheetValues[name],
      ),
    ]),
  ) as Record<SheetName, ReturnType<typeof rowsToObjects>>;

  const groups = parseRows(
    "grupos",
    sheetGrupoSchema,
    rows.grupos,
    sheetGrupoToDomain,
  )
    .filter((row) => row.valid)
    .map((row) => row.data);
  const existingKeys: AtaBusinessKey[] = rows.atas.flatMap((row) => {
    const result = sheetAtaBusinessKeySchema.safeParse(row.value);
    return result.success ? [result.data] : [];
  });
  assertCreationAllowed(submission, groups, existingKeys);

  const sheetIds = Object.fromEntries(
    (metadataResponse.data.sheets ?? []).map((sheet) => [
      sheet.properties?.title,
      sheet.properties?.sheetId,
    ]),
  ) as Partial<Record<SheetName, number>>;
  for (const name of names) {
    if (typeof sheetIds[name] !== "number") {
      throw new Error(`ID da aba ${name} não encontrado.`);
    }
  }

  const registro = materializeAtaSubmission(submission);
  const nextRows = {
    atas: firstEmptyDataRowNumber(sheetValues.atas),
    servidores: firstEmptyDataRowNumber(sheetValues.servidores),
    participacao: firstEmptyDataRowNumber(sheetValues.participacao),
    visitantes: firstEmptyDataRowNumber(sheetValues.visitantes),
    ingressos: firstEmptyDataRowNumber(sheetValues.ingressos),
    trocas_chaveiro: firstEmptyDataRowNumber(sheetValues.trocas_chaveiro),
  };
  const requests = buildAtomicWriteRequests(
    registro,
    sheetIds as Record<SheetName, number>,
    nextRows,
  );
  await executeAtomicBatch(sheets, spreadsheetId, requests);
  return registro.ata.ata_id;
}
