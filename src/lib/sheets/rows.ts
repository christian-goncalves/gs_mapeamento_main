import type { z } from "zod";

export function rowsToObjects(
  expectedHeaders: readonly string[],
  values: string[][],
) {
  const [headers = [], ...rows] = values;
  if (
    headers.length !== expectedHeaders.length ||
    headers.some((header, index) => header !== expectedHeaders[index])
  ) {
    throw new Error(
      `Cabeçalho inválido. Esperado: ${expectedHeaders.join(", ")}. Recebido: ${headers.join(", ")}.`,
    );
  }

  return rows
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) =>
      Object.fromEntries(
        expectedHeaders.map((header, index) => [header, row[index] ?? ""]),
      ),
    );
}

export type ParsedRow<T> =
  | { valid: true; rowNumber: number; data: T }
  | { valid: false; rowNumber: number; errors: string[] };

export function parseRows<T>(
  schema: z.ZodType<T>,
  rows: Record<string, string>[],
): ParsedRow<T>[] {
  return rows.map((row, index) => {
    const result = schema.safeParse(row);
    if (result.success) {
      return { valid: true, rowNumber: index + 2, data: result.data };
    }
    return {
      valid: false,
      rowNumber: index + 2,
      errors: result.error.issues.map((issue) =>
        `${issue.path.join(".") || "registro"}: ${issue.message}`,
      ),
    };
  });
}
