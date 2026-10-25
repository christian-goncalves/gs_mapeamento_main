import { sheets as createSheetsClient } from "@googleapis/sheets";
import { JWT } from "google-auth-library";

import { reconcileSheetContract } from "../src/lib/sheets/contract-reconciliation";
import { parseApplyOptions } from "./cli-apply-guard";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}.`);
  return value;
}

async function main() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID ?? "";
  const { apply, dryRun } = parseApplyOptions(process.argv.slice(2), spreadsheetId);
  const auth = new JWT({
    email: required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: required("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = createSheetsClient({ version: "v4", auth });
  console.log(JSON.stringify({ target: { spreadsheetId }, mode: dryRun ? "simulation" : "apply" }));
  const result = await reconcileSheetContract(
    sheets,
    required("GOOGLE_SHEETS_ID"),
    { dryRun },
  );

  console.log(
    JSON.stringify({
      target: { title: "contrato geral; confira a planilha configurada", spreadsheetId },
      dryRun,
      apply,
      createdSheets: result.createdSheets,
      addedColumns: result.addedColumns,
      validatedSheets: result.validatedSheets,
      plannedRequestCount: result.requestCount,
      appliedRequestCount: dryRun ? 0 : result.requestCount,
    }),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falha na reconciliação do contrato.");
  process.exitCode = 1;
});
