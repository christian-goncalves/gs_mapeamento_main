export type ResponsavelAtasOrder = [number, "asc" | "desc"][];

export const RESPONSAVEL_ATAS_INITIAL_ORDER: ResponsavelAtasOrder = [
  [1, "desc"],
  [2, "desc"],
];

export function decodeResponsavelAtasOrder(value?: string): ResponsavelAtasOrder {
  if (!value) return RESPONSAVEL_ATAS_INITIAL_ORDER.map(([column, direction]) => [column, direction]);

  const parsed = value.split(",").flatMap((part): ResponsavelAtasOrder => {
    const match = /^(\d+)\.(asc|desc)$/.exec(part);
    if (!match) return [];
    const column = Number(match[1]);
    if (!Number.isInteger(column) || column < 0 || column > 4) return [];
    return [[column, match[2] as "asc" | "desc"]];
  });

  return parsed.length
    ? parsed
    : RESPONSAVEL_ATAS_INITIAL_ORDER.map(([column, direction]) => [column, direction]);
}

export function encodeResponsavelAtasOrder(
  order: [number, number | string][],
) {
  return order
    .map(([column, direction]) =>
      `${column}.${direction === 1 || direction === "asc" ? "asc" : "desc"}`,
    )
    .join(",");
}

export const RESPONSAVEL_ATAS_INITIAL_ORDER_QUERY =
  encodeResponsavelAtasOrder(RESPONSAVEL_ATAS_INITIAL_ORDER);
