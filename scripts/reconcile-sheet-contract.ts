import { sheets as createSheetsClient } from "@googleapis/sheets";
import { JWT } from "google-auth-library";

import { reconcileSheetContract } from "../src/lib/sheets/contract-reconciliation";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}.`);
  return value;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const auth = new JWT({
    email: required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: required("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = createSheetsClient({ version: "v4", auth });
  const result = await reconcileSheetContract(
    sheets,
    required("GOOGLE_SHEETS_ID"),
    { dryRun },
  );

  console.log(
    JSON.stringify({
      dryRun,
      createdSheets: result.createdSheets,
      addedColumns: result.addedColumns,
      validatedSheets: result.validatedSheets,
      plannedRequestCount: result.requestCount,
      appliedRequestCount: dryRun ? 0 : result.requestCount,
    }),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
