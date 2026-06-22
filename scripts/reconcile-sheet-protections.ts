import { google } from "googleapis";

import {
  parseManualSheetsEditEnabled,
  reconcileSheetProtections,
} from "../src/lib/sheets/protection-policy";

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
  const result = await reconcileSheetProtections(sheets, {
    spreadsheetId: required("GOOGLE_SHEETS_ID"),
    serviceAccountEmail: required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    manualEditEnabled: parseManualSheetsEditEnabled(
      process.env.MANUAL_SHEETS_EDIT_ENABLED,
    ),
  });

  console.log(
    JSON.stringify({
      manualEditEnabled: result.manualEditEnabled,
      managedProtectionCount: result.managedProtectionCount,
      appliedRequestCount: result.requestCount,
    }),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
