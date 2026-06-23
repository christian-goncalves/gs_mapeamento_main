import { google } from "googleapis";

import { reconcileSheetContract } from "../src/lib/sheets/contract-reconciliation";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}.`);
  return value;
}

async function main() {
  const auth = new google.auth.JWT({
    email: required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: required("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const result = await reconcileSheetContract(
    sheets,
    required("GOOGLE_SHEETS_ID"),
  );

  console.log(
    JSON.stringify({
      createdSheets: result.createdSheets,
      addedColumns: result.addedColumns,
      validatedSheets: result.validatedSheets,
      appliedRequestCount: result.requestCount,
    }),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
