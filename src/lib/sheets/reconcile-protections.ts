import "server-only";

import { getSheetsClient, getSpreadsheetId } from "./client";
import {
  parseManualSheetsEditEnabled,
  reconcileSheetProtections,
} from "./protection-policy";

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

export function reconcileConfiguredSheetProtections() {
  return reconcileSheetProtections(getSheetsClient(), {
    spreadsheetId: getSpreadsheetId(),
    serviceAccountEmail: requiredEnvironment("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    manualEditEnabled: parseManualSheetsEditEnabled(
      process.env.MANUAL_SHEETS_EDIT_ENABLED,
    ),
  });
}
