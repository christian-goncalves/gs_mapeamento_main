import "server-only";

import { aggregateContractRows } from "@/domain/aggregate";
import type {
  Ata,
  Grupo,
  GrupoHorario,
  Ingresso,
  Participacao,
  Servidor,
  TrocaChaveiro,
  Visitante,
} from "@/domain/entities";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { SHEET_HEADERS, type SheetName } from "./contract";
import {
  parseRows,
  rowsToObjects,
  type LocatedObject,
  type ParsedRow,
  type RowDiagnostic,
} from "./rows";
import {
  sheetAtaSchema,
  sheetAtaToDomain,
  sheetGrupoSchema,
  sheetGrupoHorarioSchema,
  sheetGrupoHorarioToDomain,
  sheetGrupoToDomain,
  sheetIngressoSchema,
  sheetIngressoToDomain,
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

function missingSheetDiagnostic(name: SheetName): RowDiagnostic {
  return {
    sheet: name,
    rowNumber: 1,
    field: "aba",
    message: "Aba ausente no Sheets. Reconciliar o contrato antes de usar este dado.",
  };
}

function isMissingSheetRangeError(error: unknown, name: SheetName) {
  return (
    error instanceof Error &&
    error.message.includes(`Unable to parse range: ${name}!`)
  );
}

async function readContractSheets() {
  const names = Object.keys(SHEET_HEADERS) as SheetName[];
  const sheets = getSheetsClient();

  try {
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: getSpreadsheetId(),
      ranges: names.map((name) => `${name}!A:Z`),
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "SERIAL_NUMBER",
    });
    return {
      diagnostics: [],
      values: Object.fromEntries(
        names.map((name, index) => [
          name,
          rowsToObjects(
            SHEET_HEADERS[name],
            (response.data.valueRanges?.[index]?.values as
              | (string | number | boolean)[][]
              | undefined) ?? [],
          ),
        ]),
      ) as Record<SheetName, LocatedObject[]>,
    };
  } catch (error) {
    if (
      !names.some((name) => isMissingSheetRangeError(error, name))
    ) {
      throw error;
    }
  }

  const diagnostics: RowDiagnostic[] = [];
  const entries = await Promise.all(
    names.map(async (name) => {
      try {
        return [name, await readSheet(name)] as const;
      } catch (error) {
        if (!isMissingSheetRangeError(error, name)) throw error;
        diagnostics.push(missingSheetDiagnostic(name));
        return [name, []] as const;
      }
    }),
  );
  return {
    diagnostics,
    values: Object.fromEntries(entries) as Record<SheetName, LocatedObject[]>,
  };
}

export async function listGroups(): Promise<ParsedRow<Grupo>[]> {
  return parseRows(
    "grupos",
    sheetGrupoSchema,
    await readSheet("grupos"),
    sheetGrupoToDomain,
  );
}

export async function listGrupoHorarios(): Promise<ParsedRow<GrupoHorario>[]> {
  return parseRows(
    "grupo_horarios",
    sheetGrupoHorarioSchema,
    await readSheet("grupo_horarios"),
    sheetGrupoHorarioToDomain,
  );
}

export async function listActiveGroups() {
  const rows = await listGroups();
  return rows
    .filter((row): row is Extract<typeof row, { valid: true }> => row.valid)
    .map((row) => row.data)
    .filter((group) => group.ativo)
    .sort((first, second) => first.grupo_nome.localeCompare(second.grupo_nome, "pt-BR"));
}

export async function listActiveGroupOptions() {
  const result = await readAggregatedAtas();
  return result.grupos
    .filter((group) => group.ativo)
    .sort((first, second) => first.grupo_nome.localeCompare(second.grupo_nome, "pt-BR"))
    .map((group) => ({
      ...group,
      horarios: result.grupo_horarios.filter(
        (horario) => horario.grupo_id === group.grupo_id && horario.ativo,
      ),
    }));
}

export async function getActiveGroupByAtaLink(link: string) {
  const result = await readAggregatedAtas();
  const group = result.grupos.find(
    (item) => item.link_formulario_ata === link,
  );
  if (!group || !group.ativo) return null;
  return {
    group,
    horarios: result.grupo_horarios.filter(
      (horario) => horario.grupo_id === group.grupo_id && horario.ativo,
    ),
  };
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

export async function listIngressos(): Promise<ParsedRow<Ingresso>[]> {
  return parseRows(
    "ingressos",
    sheetIngressoSchema,
    await readSheet("ingressos"),
    sheetIngressoToDomain,
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
  const { diagnostics, values } = await readContractSheets();

  const grupos = parseRows(
    "grupos",
    sheetGrupoSchema,
    values.grupos,
    sheetGrupoToDomain,
  );
  const grupo_horarios = parseRows(
    "grupo_horarios",
    sheetGrupoHorarioSchema,
    values.grupo_horarios,
    sheetGrupoHorarioToDomain,
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
  const ingressos = parseRows(
    "ingressos",
    sheetIngressoSchema,
    values.ingressos,
    sheetIngressoToDomain,
  );
  const trocas_chaveiro = parseRows(
    "trocas_chaveiro",
    sheetTrocaChaveiroSchema,
    values.trocas_chaveiro,
    sheetTrocaChaveiroToDomain,
  );
  const aggregated = aggregateContractRows({
    grupos,
    grupo_horarios,
    atas,
    servidores,
    participacao,
    visitantes,
    ingressos,
    trocas_chaveiro,
  });
  return {
    ...aggregated,
    diagnostics: [...diagnostics, ...aggregated.diagnostics].sort(
      (first, second) =>
        first.sheet.localeCompare(second.sheet) ||
        first.rowNumber - second.rowNumber ||
        first.field.localeCompare(second.field),
    ),
  };
}
