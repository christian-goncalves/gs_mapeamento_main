import { SHEET_HEADERS, type SheetName } from "./contract";
import { rowsToObjects, type LocatedObject, type SheetCell } from "./rows";

const SHEET_V2_EXTENSIONS: Partial<Record<SheetName, readonly string[]>> = {
  grupos: ["revisao_atas_ativa"],
  atas: [
    "status_registro",
    "status_aprovacao",
    "revisao_de_ata_id",
    "motivo_alteracao",
    "alterado_por",
    "alterado_em",
    "excluida_em",
    "aprovado_por",
    "aprovado_em",
    "formato_comemorativa",
    "formato_servico",
  ],
} as const satisfies Partial<Record<SheetName, readonly string[]>>;

export const V2_NEW_SHEET_HEADERS = {
  grupo_plataformas: [
    "plataforma_id",
    "grupo_id",
    "tipo",
    "link",
    "id_acesso",
    "senha_pin",
    "ativo",
    "created_at",
    "updated_at",
  ],
  grupo_funcoes_servidor: [
    "grupo_funcao_servidor_id",
    "grupo_id",
    "nome",
    "nome_normalizado",
    "ativo",
    "created_at",
    "updated_at",
  ],
  operacoes: [
    "operacao_id",
    "hash_solicitacao",
    "tipo",
    "ator",
    "estado",
    "criada_em",
    "concluida_em",
    "resultado_ref",
  ],
} as const;

export const V2_OPTIONAL_SHEETS = ["grupo_plataformas", "grupo_funcoes_servidor"] as const;

export type AtaRegistroStatus = "ativa" | "substituida" | "excluida";
export type AtaApprovalStatus = "aprovada" | "pendente_revisao";

function normalizeHeaderAliases(name: SheetName, values: SheetCell[][]) {
  if (name !== "visitantes" || values.length === 0) return values;
  const [headers, ...rows] = values;
  return [
    headers.map((header) => {
      if (header === "categoria") return "descricao";
      if (header === "origem_contato" || header === "como_chegou_a_na?") {
        return "como_chegou_a_na";
      }
      return header;
    }),
    ...rows,
  ];
}

function normalizeGroupScheduleHeaders(values: SheetCell[][]): SheetCell[][] {
  if (values.length === 0) return values;
  const [headers, ...rows] = values;
  const currentHeaders = [...SHEET_HEADERS.grupo_horarios];
  const objectHeaders = [...currentHeaders, "link_reuniao"];
  const legacyHeaders = [
    "horario_id", "grupo_id", "dia_semana", "hora_inicio", "link_reuniao",
    "ativo", "created_at", "updated_at",
  ];
  const legacyWithPlatform = [...legacyHeaders, "plataforma_id"];
  const legacyWithExtensions = [...legacyWithPlatform, "hora_termino"];
  const actual = headers.map(String);
  const supported = [currentHeaders, legacyHeaders, legacyWithPlatform, legacyWithExtensions]
    .some((candidate) => candidate.length === actual.length && candidate.every((header, index) => header === actual[index]));
  if (!supported || new Set(actual).size !== actual.length) return values;

  return [
    objectHeaders,
    ...rows.map((row) => {
      const valuesByHeader = new Map(actual.map((header, index) => [header, row[index] ?? ""]));
      return objectHeaders.map((header) => valuesByHeader.get(header) ?? "");
    }),
  ];
}

function normalizeMissingGroupFoundationDate(
  name: SheetName,
  values: SheetCell[][],
): SheetCell[][] {
  if (name !== "grupos" || values.length === 0) return values;
  const [headers, ...rows] = values;
  const foundationIndex = SHEET_HEADERS.grupos.indexOf("data_fundacao");
  if (foundationIndex < 0 || headers.includes("data_fundacao")) return values;

  const headersWithoutFoundation = SHEET_HEADERS.grupos.filter(
    (header) => header !== "data_fundacao",
  );
  const extensions = SHEET_V2_EXTENSIONS.grupos ?? [];
  const extensionCount = headers.length - headersWithoutFoundation.length;
  const hasTrailingExtensions =
    extensionCount > 0 &&
    headers
      .slice(-extensionCount)
      .every((header) => extensions.includes(String(header)));
  const baseHeaders = hasTrailingExtensions
    ? headers.slice(0, -extensionCount)
    : headers;
  const matchesLegacyPrefix =
    baseHeaders.length <= headersWithoutFoundation.length &&
    baseHeaders.every(
      (header, index) => header === headersWithoutFoundation[index],
    );

  if (!matchesLegacyPrefix) return values;
  if (
    hasTrailingExtensions &&
    baseHeaders.length !== headersWithoutFoundation.length
  ) {
    return values;
  }

  const normalizedHeaders = [
    ...headers.slice(0, foundationIndex),
    "data_fundacao",
    ...headers.slice(foundationIndex),
  ];
  return [
    normalizedHeaders,
    ...rows.map((row) => [
      ...row.slice(0, foundationIndex),
      "",
      ...row.slice(foundationIndex),
    ]),
  ];
}

export function compatibleHeaders(name: SheetName): readonly string[] {
  return [...SHEET_HEADERS[name], ...(SHEET_V2_EXTENSIONS[name] ?? [])];
}

export function groupPlatformRowsToObjects(values: SheetCell[][]): LocatedObject[] {
  return rowsToObjects(V2_NEW_SHEET_HEADERS.grupo_plataformas, values);
}

export function rowsToCompatibleObjects(
  name: SheetName,
  values: SheetCell[][],
  options: { allowMissingTrailingHeaders?: number } = {},
) {
  const normalizedValues = normalizeMissingGroupFoundationDate(
    name,
    name === "grupo_horarios"
      ? normalizeGroupScheduleHeaders(values)
      : normalizeHeaderAliases(name, values),
  );
  const expectedHeaders = name === "grupo_horarios"
    ? [...SHEET_HEADERS.grupo_horarios, "link_reuniao"]
    : SHEET_HEADERS[name];
  return rowsToObjects(expectedHeaders, normalizedValues, {
    ...options,
    allowExtraTrailingHeaders: SHEET_V2_EXTENSIONS[name] ?? [],
  });
}

export function rowsToVersionedObjects(
  name: SheetName,
  values: SheetCell[][],
): LocatedObject[] {
  const headers = compatibleHeaders(name);
  const extensions = SHEET_V2_EXTENSIONS[name] ?? [];
  const rows = rowsToObjects(
    name === "grupo_horarios" ? [...headers, "link_reuniao"] : headers,
    normalizeMissingGroupFoundationDate(
      name,
      name === "grupo_horarios"
        ? normalizeGroupScheduleHeaders(values)
        : normalizeHeaderAliases(name, values),
    ),
    {
      allowMissingTrailingHeaders:
        extensions.length + (name === "grupos" ? 3 : 0),
    },
  );
  if (name !== "atas") return rows;
  return rows.map((row) => ({
    ...row,
    value: { ...row.value, ...ataStatuses(row.value) },
  }));
}

export function sheetColumnName(zeroBasedIndex: number): string {
  if (!Number.isInteger(zeroBasedIndex) || zeroBasedIndex < 0) {
    throw new Error("Índice de coluna inválido.");
  }
  let name = "";
  let current = zeroBasedIndex + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

export function sheetReadRange(name: SheetName): string {
  return `${name}!A:${sheetColumnName(compatibleHeaders(name).length - 1)}`;
}

export function ataStatuses(value: {
  status_registro?: unknown;
  status_aprovacao?: unknown;
}) {
  const statusRegistro =
    value.status_registro == null || value.status_registro === ""
      ? "ativa"
      : value.status_registro;
  const statusAprovacao =
    value.status_aprovacao == null || value.status_aprovacao === ""
      ? "aprovada"
      : value.status_aprovacao;
  if (
    !["ativa", "substituida", "excluida"].includes(String(statusRegistro)) ||
    !["aprovada", "pendente_revisao"].includes(String(statusAprovacao))
  ) {
    throw new Error("Estado V2 da ata inválido.");
  }
  return {
    status_registro: statusRegistro as AtaRegistroStatus,
    status_aprovacao: statusAprovacao as AtaApprovalStatus,
  };
}
