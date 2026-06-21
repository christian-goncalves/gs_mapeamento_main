import "server-only";

import { ataSchema, grupoSchema, type Ata, type Grupo } from "@/domain/entities";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { parseRows, rowsToObjects, type ParsedRow } from "./rows";

export const SHEET_HEADERS = {
  grupos: [
    "grupo_id", "zoom_id", "grupo_nome", "ordem", "ativo", "created_at", "updated_at",
  ],
  atas: [
    "ata_id", "grupo_id", "data_reuniao", "hora_inicio", "plataforma", "tipo_reuniao",
    "formato_partilha", "formato_estudo", "formato_tematico", "formato_literatura",
    "formato_passos", "formato_tradicoes", "total_membros_presentes", "created_at", "updated_at",
  ],
  servidores: ["servidor_id", "ata_id", "nome", "ordem", "created_at", "updated_at"],
  participacao: ["participacao_id", "ata_id", "localidade", "estado", "pais", "presencas", "created_at", "updated_at"],
  visitantes: ["visitante_id", "ata_id", "nome", "cidade", "categoria", "origem_contato", "created_at", "updated_at"],
  trocas_chaveiro: ["troca_chaveiro_id", "ata_id", "tempo_limpo", "created_at", "updated_at"],
} as const;

type SheetName = keyof typeof SHEET_HEADERS;

async function readSheet(name: SheetName) {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${name}!A:Z`,
  });
  return rowsToObjects(
    SHEET_HEADERS[name],
    (response.data.values as string[][] | undefined) ?? [],
  );
}

export async function listGroups(): Promise<ParsedRow<Grupo>[]> {
  return parseRows(grupoSchema, await readSheet("grupos"));
}

export async function listActiveGroups() {
  const rows = await listGroups();
  return rows
    .filter((row): row is Extract<typeof row, { valid: true }> => row.valid)
    .map((row) => row.data)
    .filter((group) => group.ativo)
    .sort((first, second) => first.ordem - second.ordem);
}

export async function listAtas(): Promise<ParsedRow<Ata>[]> {
  return parseRows(ataSchema, await readSheet("atas"));
}
