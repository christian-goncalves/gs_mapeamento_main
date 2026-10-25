export type ResponsavelAtasOrder = [number, "asc" | "desc"][];

export const RESPONSAVEL_ATAS_INITIAL_ORDER: ResponsavelAtasOrder = [
  [1, "desc"],
  [2, "desc"],
];

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
