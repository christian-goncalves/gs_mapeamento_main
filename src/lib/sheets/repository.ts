import "server-only";

import { aggregateContractRows } from "@/domain/aggregate";
import type {
  Ata,
  Grupo,
  Participacao,
  Servidor,
  TrocaChaveiro,
  Visitante,
} from "@/domain/entities";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { SHEET_HEADERS, type SheetName } from "./contract";
import { parseRows, rowsToObjects, type ParsedRow } from "./rows";
import {
  sheetAtaSchema,
  sheetAtaToDomain,
  sheetGrupoSchema,
  sheetGrupoToDomain,
  sheetParticipacaoSchema,
  sheetParticipacaoToDomain,
  sheetServidorSchema,
  sheetServidorToDomain,
  sheetTrocaChaveiroSchema,
  sheetTrocaChaveiroToDomain,
  sheetVisitanteSchema,
  sheetVisitanteToDomain,
} from "./schemas";

async function readSheet(name: SheetName) {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${name}!A:Z`,
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });
  return rowsToObjects(
    SHEET_HEADERS[name],
    (response.data.values as (string | number | boolean)[][] | undefined) ?? [],
  );
}

export async function listGroups(): Promise<ParsedRow<Grupo>[]> {
  return parseRows(
    "grupos",
    sheetGrupoSchema,
    await readSheet("grupos"),
    sheetGrupoToDomain,
  );
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
  return parseRows(
    "atas",
    sheetAtaSchema,
    await readSheet("atas"),
    sheetAtaToDomain,
  );
}

export async function listServidores(): Promise<ParsedRow<Servidor>[]> {
  return parseRows(
    "servidores",
    sheetServidorSchema,
    await readSheet("servidores"),
    sheetServidorToDomain,
  );
}

export async function listParticipacao(): Promise<ParsedRow<Participacao>[]> {
  return parseRows(
    "participacao",
    sheetParticipacaoSchema,
    await readSheet("participacao"),
    sheetParticipacaoToDomain,
  );
}

export async function listVisitantes(): Promise<ParsedRow<Visitante>[]> {
  return parseRows(
    "visitantes",
    sheetVisitanteSchema,
    await readSheet("visitantes"),
    sheetVisitanteToDomain,
  );
}

export async function listTrocasChaveiro(): Promise<
  ParsedRow<TrocaChaveiro>[]
> {
  return parseRows(
    "trocas_chaveiro",
    sheetTrocaChaveiroSchema,
    await readSheet("trocas_chaveiro"),
    sheetTrocaChaveiroToDomain,
  );
}

export async function readAggregatedAtas() {
  const names = Object.keys(SHEET_HEADERS) as SheetName[];
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: getSpreadsheetId(),
    ranges: names.map((name) => `${name}!A:Z`),
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });
  const values = Object.fromEntries(
    names.map((name, index) => [
      name,
      rowsToObjects(
        SHEET_HEADERS[name],
        (response.data.valueRanges?.[index]?.values as
          | (string | number | boolean)[][]
          | undefined) ?? [],
      ),
    ]),
  ) as Record<SheetName, ReturnType<typeof rowsToObjects>>;

  const grupos = parseRows(
    "grupos",
    sheetGrupoSchema,
    values.grupos,
    sheetGrupoToDomain,
  );
  const atas = parseRows(
    "atas",
    sheetAtaSchema,
    values.atas,
    sheetAtaToDomain,
  );
  const servidores = parseRows(
    "servidores",
    sheetServidorSchema,
    values.servidores,
    sheetServidorToDomain,
  );
  const participacao = parseRows(
    "participacao",
    sheetParticipacaoSchema,
    values.participacao,
    sheetParticipacaoToDomain,
  );
  const visitantes = parseRows(
    "visitantes",
    sheetVisitanteSchema,
    values.visitantes,
    sheetVisitanteToDomain,
  );
  const trocas_chaveiro = parseRows(
    "trocas_chaveiro",
    sheetTrocaChaveiroSchema,
    values.trocas_chaveiro,
    sheetTrocaChaveiroToDomain,
  );
  return aggregateContractRows({
    grupos,
    atas,
    servidores,
    participacao,
    visitantes,
    trocas_chaveiro,
  });
}
