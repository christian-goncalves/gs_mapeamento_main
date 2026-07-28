import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { sheets as createSheetsClient } from "@googleapis/sheets";
import { JWT } from "google-auth-library";
import {
  buildAtaNameSuggestionsDocument,
  type AtaNameSuggestionInput,
} from "../src/domain/ata-name-suggestions";
import { SHEET_HEADERS } from "../src/lib/sheets/contract";
import { rowsToObjects } from "../src/lib/sheets/rows";
import {
  sheetAtaSchema,
  sheetAtaToDomain,
  sheetServidorSchema,
  sheetServidorToDomain,
} from "../src/lib/sheets/schemas";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}.`);
  return value;
}

async function main() {
const auth = new JWT({
  email: required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
  key: required("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = createSheetsClient({ version: "v4", auth });
const spreadsheetId = required("GOOGLE_SHEETS_ID");
const response = await sheets.spreadsheets.values.batchGet({
  spreadsheetId,
  ranges: ["atas!A:Z", "servidores!A:Z"],
  valueRenderOption: "UNFORMATTED_VALUE",
  dateTimeRenderOption: "SERIAL_NUMBER",
});

const ataRows = rowsToObjects(
  SHEET_HEADERS.atas,
  (response.data.valueRanges?.[0]?.values as (string | number | boolean)[][] | undefined) ?? [],
);
const servidorRows = rowsToObjects(
  SHEET_HEADERS.servidores,
  (response.data.valueRanges?.[1]?.values as (string | number | boolean)[][] | undefined) ?? [],
);

const atas = ataRows.map((row) => ({
  rowNumber: row.rowNumber,
  result: sheetAtaSchema.safeParse(row.value),
}));
const servidores = servidorRows.map((row) => ({
  rowNumber: row.rowNumber,
  result: sheetServidorSchema.safeParse(row.value),
}));
const invalidRows = [
  ...atas
    .filter((row) => !row.result.success)
    .map((row) => `atas linha ${row.rowNumber}`),
  ...servidores
    .filter((row) => !row.result.success)
    .map((row) => `servidores linha ${row.rowNumber}`),
];
if (invalidRows.length > 0) {
  console.error("A planilha possui linhas inválidas. Corrija antes de reconstruir sugestões.");
  for (const row of invalidRows) console.error(`- ${row}`);
  process.exit(1);
}

const validAtas = atas.map((row) => {
  if (!row.result.success) throw new Error(`Ata inválida na linha ${row.rowNumber}.`);
  return sheetAtaToDomain(row.result.data);
});
const servidoresByAta = new Map<string, string[]>();
for (const row of servidores) {
  if (!row.result.success) {
    throw new Error(`Servidor inválido na linha ${row.rowNumber}.`);
  }
  const servidor = sheetServidorToDomain(row.result.data);
  servidoresByAta.set(servidor.ata_id, [
    ...(servidoresByAta.get(servidor.ata_id) ?? []),
    servidor.nome,
  ]);
}

const inputs: AtaNameSuggestionInput[] = validAtas.map((ata) => ({
  grupo_id: ata.grupo_id,
  preenchido_por: ata.preenchido_por,
  servidores: servidoresByAta.get(ata.ata_id) ?? [],
}));
const document = buildAtaNameSuggestionsDocument(inputs);
const output = join(process.cwd(), "data", "ata-name-suggestions.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(document, null, 2)}\n`, "utf8");

console.log(
  `Sugestões reconstruídas para ${Object.keys(document.groups).length} grupo(s).`,
);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
