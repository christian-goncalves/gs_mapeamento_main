import "server-only";

import { google } from "googleapis";

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

export function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: requiredEnvironment("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: requiredEnvironment("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

export function getSpreadsheetId() {
  return requiredEnvironment("GOOGLE_SHEETS_ID");
}
