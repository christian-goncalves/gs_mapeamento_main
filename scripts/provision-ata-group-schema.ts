import { sheets as createSheetsClient } from "@googleapis/sheets";
import { JWT } from "google-auth-library";

import { provisionAtaGroupSchema } from "../src/lib/sheets/contract-reconciliation";
import { parseApplyOptions } from "./cli-apply-guard";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}.`);
  return value;
}

async function main() {
  const spreadsheetId = required("GOOGLE_SHEETS_ID");
  const { apply, dryRun } = parseApplyOptions(process.argv.slice(2), spreadsheetId);
  const auth = new JWT({
    email: required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: required("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = createSheetsClient({ version: "v4", auth });
  const result = await provisionAtaGroupSchema(sheets, spreadsheetId, {
    apply,
    onPlan: (plan) => {
      console.log(JSON.stringify({ operationId: plan.operationId, target: { title: plan.spreadsheetTitle, spreadsheetId: plan.spreadsheetId }, mode: dryRun ? "simulation" : "apply", createdSheets: plan.createdSheets, addedColumns: plan.addedColumns, plannedBatchUpdateCalls: plan.requestCount > 0 ? 1 : 0, plannedSubrequestCount: plan.requestCount, gateReminder: "--apply não substitui CP-01 nem autorização específica." }));
    },
  });

  console.log(JSON.stringify({ ...result, mode: dryRun ? "simulation" : "apply", readback: apply && result.requestCount > 0 ? "confirmed" : "not-needed" }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falha no provisionamento do schema de atas.");
  process.exitCode = 1;
});
