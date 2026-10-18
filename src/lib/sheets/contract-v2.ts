import { SHEET_HEADERS, type SheetName } from "./contract";
import { rowsToObjects, type LocatedObject, type SheetCell } from "./rows";

const SHEET_V2_EXTENSIONS: Partial<Record<SheetName, readonly string[]>> = {
  grupos: ["revisao_atas_ativa"],
  grupo_horarios: ["plataforma_id", "vigente_desde", "vigente_ate"],
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
  ingressos: ["visitante_id"],
} as const satisfies Partial<Record<SheetName, readonly string[]>>;

export const V2_NEW_SHEET_HEADERS = {
  grupo_plataformas: [
    "plataforma_id",
    "grupo_id",
    "nome",
    "tipo",
    "link_padrao",
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

export function compatibleHeaders(name: SheetName): readonly string[] {
  return [...SHEET_HEADERS[name], ...(SHEET_V2_EXTENSIONS[name] ?? [])];
}

export function rowsToCompatibleObjects(
  name: SheetName,
  values: SheetCell[][],
  options: { allowMissingTrailingHeaders?: number } = {},
) {
  return rowsToObjects(SHEET_HEADERS[name], normalizeHeaderAliases(name, values), {
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
  const rows = rowsToObjects(headers, normalizeHeaderAliases(name, values), {
    allowMissingTrailingHeaders:
      extensions.length + (name === "grupos" ? 3 : 0),
  });
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
