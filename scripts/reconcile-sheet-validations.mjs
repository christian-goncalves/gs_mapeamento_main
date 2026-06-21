import { google } from "googleapis";

const HEADERS = {
  grupos: ["grupo_id", "zoom_id", "grupo_nome", "ordem", "ativo", "created_at", "updated_at"],
  atas: [
    "ata_id", "grupo_id", "data_reuniao", "hora_inicio", "plataforma", "tipo_reuniao",
    "formato_partilha", "formato_estudo", "formato_tematico", "formato_literatura",
    "formato_passos", "formato_tradicoes", "total_membros_presentes", "created_at", "updated_at",
  ],
  servidores: ["servidor_id", "ata_id", "nome", "ordem", "created_at", "updated_at"],
  participacao: ["participacao_id", "ata_id", "localidade", "estado", "pais", "presencas", "created_at", "updated_at"],
  visitantes: ["visitante_id", "ata_id", "nome", "cidade", "categoria", "origem_contato", "created_at", "updated_at"],
  trocas_chaveiro: ["troca_chaveiro_id", "ata_id", "tempo_limpo", "created_at", "updated_at"],
};

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}.`);
  return value;
}

const auth = new google.auth.JWT({
  email: required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
  key: required("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = required("GOOGLE_SHEETS_ID");

const metadata = await sheets.spreadsheets.get({
  spreadsheetId,
  fields: "sheets(properties(sheetId,title,gridProperties(rowCount)))",
});
const properties = new Map(
  (metadata.data.sheets ?? []).map((sheet) => [sheet.properties.title, sheet.properties]),
);

for (const [name, expected] of Object.entries(HEADERS)) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${name}!1:1`,
  });
  const actual = response.data.values?.[0] ?? [];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Cabeçalho inválido em ${name}. Esperado: ${expected.join(", ")}. Recebido: ${actual.join(", ")}.`,
    );
  }
}

const atas = properties.get("atas");
if (!atas?.sheetId || !atas.gridProperties?.rowCount) {
  throw new Error("Metadados da aba atas não encontrados.");
}

function listValidation(startColumnIndex, values) {
  return {
    repeatCell: {
      range: {
        sheetId: atas.sheetId,
        startRowIndex: 1,
        endRowIndex: atas.gridProperties.rowCount,
        startColumnIndex,
        endColumnIndex: startColumnIndex + 1,
      },
      cell: {
        dataValidation: {
          condition: {
            type: "ONE_OF_LIST",
            values: values.map((userEnteredValue) => ({ userEnteredValue })),
          },
          strict: true,
          showCustomUi: true,
        },
      },
      fields: "dataValidation",
    },
  };
}

await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: {
    requests: [
      listValidation(4, ["Zoom"]),
      listValidation(5, ["Aberta", "Fechada"]),
    ],
  },
});

console.log("Cabeçalhos confirmados e validações de atas reconciliadas.");
