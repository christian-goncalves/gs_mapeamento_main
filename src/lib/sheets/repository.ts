import "server-only";

import { aggregateContractRows } from "@/domain/aggregate";
import { uniqueSortedAtaNameSuggestions } from "@/domain/ata-name-suggestions";
import { isSecureAtaLinkToken } from "@/lib/ata-link-token";
import type {
  Ata,
  Grupo,
  GrupoHorario,
  GrupoPlataforma,
  GrupoServidorMesa,
  Ingresso,
  Participacao,
  Servidor,
  TrocaChaveiro,
  Visitante,
} from "@/domain/entities";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { SHEET_HEADERS, type SheetName } from "./contract";
import { groupPlatformRowsToObjects, rowsToVersionedObjects, sheetReadRange } from "./contract-v2";
import {
  parseRows,
  type LocatedObject,
  type ParsedRow,
  type RowDiagnostic,
} from "./rows";
import {
  sheetAtaSchema,
  sheetAtaBusinessKeySchema,
  sheetAtaToDomain,
  sheetGrupoSchema,
  sheetGrupoHorarioSchema,
  sheetGrupoHorarioToDomain,
  sheetGrupoPlataformaSchema,
  sheetGrupoPlataformaToDomain,
  sheetGrupoServidorMesaSchema,
  sheetGrupoServidorMesaToDomain,
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

type SheetValue = string | number | boolean;

function normalizeHeaderAliases(name: SheetName, values: SheetValue[][]) {
  if (name !== "visitantes" || values.length === 0) return values;
  const [headers, ...rows] = values;
  const normalizedHeaders = headers.map((header) => {
    if (header === "categoria") return "descricao";
    if (header === "origem_contato" || header === "como_chegou_a_na?") {
      return "como_chegou_a_na";
    }
    return header;
  });
  return [normalizedHeaders, ...rows];
}

async function readSheet(name: SheetName) {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: sheetReadRange(name),
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });
  const values = (response.data.values as SheetValue[][] | undefined) ?? [];
  return rowsToVersionedObjects(name, normalizeHeaderAliases(name, values));
}

function missingSheetDiagnostic(name: string): RowDiagnostic {
  return {
    sheet: name,
    rowNumber: 1,
    field: "aba",
    message: "Aba ausente no Sheets. Reconciliar o contrato antes de usar este dado.",
  };
}

function isMissingSheetRangeError(error: unknown, name: string) {
  return (
    error instanceof Error &&
    error.message.includes(`Unable to parse range: ${name}!`)
  );
}

function sheetsReadErrorDetails(error: unknown) {
  const candidate = error as {
    code?: unknown;
    message?: unknown;
    response?: { status?: unknown };
  };
  const status =
    typeof candidate.response?.status === "number"
      ? candidate.response.status
      : typeof candidate.code === "number"
        ? candidate.code
        : undefined;
  const message =
    typeof candidate.message === "string" ? candidate.message : String(error);
  const kind =
    status === 401 || status === 403
      ? "authentication"
      : status === 429 || /quota|rate limit/i.test(message)
        ? "quota"
        : "api";
  return { kind, status, message };
}

async function readContractSheets() {
  const names = Object.keys(SHEET_HEADERS) as SheetName[];
  const sheets = getSheetsClient();
  const diagnostics: RowDiagnostic[] = [];
  const values = names.reduce<Record<SheetName, LocatedObject[]>>(
    (result, name) => {
      result[name] = [];
      return result;
    },
    {} as Record<SheetName, LocatedObject[]>,
  );
  let pendingNames: string[] = [...names, "grupo_plataformas"];
  let groupPlatformValues: LocatedObject[] = [];

  while (pendingNames.length > 0) {
    try {
      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: getSpreadsheetId(),
          ranges: pendingNames.map((name) => name === "grupo_plataformas" ? "grupo_plataformas!A:I" : sheetReadRange(name as SheetName)),
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "SERIAL_NUMBER",
      });
      pendingNames.forEach((name, index) => {
        const sheetValues = (response.data.valueRanges?.[index]?.values as SheetValue[][] | undefined) ?? [];
        if (name === "grupo_plataformas") {
          groupPlatformValues = groupPlatformRowsToObjects(sheetValues);
          return;
        }
        values[name as SheetName] = rowsToVersionedObjects(
          name as SheetName,
          normalizeHeaderAliases(name as SheetName, sheetValues),
        );
      });
      break;
    } catch (error) {
      const missingName = pendingNames.find((name) =>
        isMissingSheetRangeError(error, name),
      );
      if (!missingName) {
        console.error(
          "[sheets.readContractSheets]",
          JSON.stringify(sheetsReadErrorDetails(error)),
        );
        throw error;
      }
      diagnostics.push(missingSheetDiagnostic(missingName));
      console.warn(
        "[sheets.readContractSheets]",
        JSON.stringify({ kind: "missing_sheet", sheet: missingName }),
      );
      pendingNames = pendingNames.filter((name) => name !== missingName);
    }
  }

  return {
    diagnostics,
    values,
    groupPlatformValues,
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

async function readGrupoPlataformasState() {
  try {
    const response = await getSheetsClient().spreadsheets.values.get({ spreadsheetId: getSpreadsheetId(), range: "grupo_plataformas!A:I", valueRenderOption: "UNFORMATTED_VALUE", dateTimeRenderOption: "SERIAL_NUMBER" });
    const rows = groupPlatformRowsToObjects((response.data.values as SheetValue[][] | undefined) ?? []);
    return { rows: parseRows("grupo_plataformas", sheetGrupoPlataformaSchema, rows, sheetGrupoPlataformaToDomain), diagnostics: [] as RowDiagnostic[] };
  } catch (error) {
    if (isMissingSheetRangeError(error, "grupo_plataformas")) return { rows: [] as ParsedRow<GrupoPlataforma>[], diagnostics: [missingSheetDiagnostic("grupo_plataformas")] };
    throw error;
  }
}

export async function listGrupoPlataformas(): Promise<ParsedRow<GrupoPlataforma>[]> {
  return (await readGrupoPlataformasState()).rows;
}

export async function listGrupoServidoresMesa(): Promise<
  ParsedRow<GrupoServidorMesa>[]
> {
  return parseRows(
    "grupo_servidores_mesa",
    sheetGrupoServidorMesaSchema,
    await readSheet("grupo_servidores_mesa"),
    sheetGrupoServidorMesaToDomain,
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
  if (!isSecureAtaLinkToken(link)) return null;

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
    plataformas: result.grupo_plataformas.filter((platform) => platform.grupo_id === group.grupo_id && platform.ativo),
  };
}

export async function listActiveAtaKeys() {
  return (await readSheet("atas")).flatMap(({ value }) => {
    // O schema da ata assume "ativa" quando o campo ainda não existe em
    // registros legados. Mantenha a mesma regra ao identificar horários ocupados.
    const statusRegistro = String(value.status_registro ?? "ativa").trim();
    if (statusRegistro !== "ativa") return [];
    const businessKey = sheetAtaBusinessKeySchema.safeParse(value);
    if (!businessKey.success) return [];
    return [{
      ata_id: String(value.ata_id ?? ""),
      ...businessKey.data,
    }];
  });
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

export async function listRecentServerNamesByGroup(
  grupoId: string,
  limit = 15,
): Promise<string[]> {
  const [ataValues, servidorValues] = await Promise.all([
    readSheet("atas"),
    readSheet("servidores"),
  ]);
  const atas = parseRows("atas", sheetAtaSchema, ataValues, sheetAtaToDomain)
    .filter((row): row is Extract<typeof row, { valid: true }> => row.valid)
    .map((row) => row.data)
    .filter((ata) => ata.grupo_id === grupoId);
  const atasById = new Map(atas.map((ata) => [ata.ata_id, ata]));
  const servidores = parseRows(
    "servidores",
    sheetServidorSchema,
    servidorValues,
    sheetServidorToDomain,
  )
    .filter((row): row is Extract<typeof row, { valid: true }> => row.valid)
    .flatMap((row) => {
      const ata = atasById.get(row.data.ata_id);
      if (!ata) return [];
      return [{
        nome: row.data.nome,
        dataHora: `${ata.data_reuniao}T${ata.hora_inicio}`,
        rowNumber: row.rowNumber,
      }];
    })
    .sort((first, second) =>
      second.dataHora.localeCompare(first.dataHora) || second.rowNumber - first.rowNumber,
    );
  const latestByName = new Map<string, string>();
  for (const servidor of servidores) {
    const key = servidor.nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLocaleLowerCase("pt-BR");
    if (key && !latestByName.has(key)) latestByName.set(key, servidor.nome);
    if (latestByName.size >= limit) break;
  }
  return uniqueSortedAtaNameSuggestions([...latestByName.values()]);
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
  const { diagnostics, values, groupPlatformValues } = await readContractSheets();

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
  const grupo_servidores_mesa = parseRows(
    "grupo_servidores_mesa",
    sheetGrupoServidorMesaSchema,
    values.grupo_servidores_mesa,
    sheetGrupoServidorMesaToDomain,
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
  const grupo_plataformas = parseRows("grupo_plataformas", sheetGrupoPlataformaSchema, groupPlatformValues, sheetGrupoPlataformaToDomain);
  const aggregated = aggregateContractRows({
    grupos,
    grupo_horarios,
    grupo_plataformas,
    grupo_servidores_mesa,
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
