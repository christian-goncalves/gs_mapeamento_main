import type { z } from "zod";

export type SheetCell = string | number | boolean;
export type LocatedObject = {
  rowNumber: number;
  value: Record<string, SheetCell>;
};

export function rowsToObjects(
  expectedHeaders: readonly string[],
  values: SheetCell[][],
): LocatedObject[] {
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
    .map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter(({ row }) => row.some((cell) => cell !== ""))
    .map(({ row, rowNumber }) => ({
      rowNumber,
      value: Object.fromEntries(
        expectedHeaders.map((header, index) => [header, row[index] ?? ""]),
      ),
    }));
}

export type RowDiagnostic = {
  sheet: string;
  rowNumber: number;
  field: string;
  message: string;
};

export type ParsedRow<T> =
  | { valid: true; sheet: string; rowNumber: number; data: T }
  | {
      valid: false;
      sheet: string;
      rowNumber: number;
      diagnostics: RowDiagnostic[];
    };

export function parseRows<SheetValue, DomainValue = SheetValue>(
  sheet: string,
  schema: z.ZodType<SheetValue>,
  rows: LocatedObject[],
  toDomain: (value: SheetValue) => DomainValue = (value) =>
    value as unknown as DomainValue,
): ParsedRow<DomainValue>[] {
  return rows.map(({ value, rowNumber }) => {
    const result = schema.safeParse(value);
    if (result.success) {
      return {
        valid: true,
        sheet,
        rowNumber,
        data: toDomain(result.data),
      };
    }
    return {
      valid: false,
      sheet,
      rowNumber,
      diagnostics: result.error.issues.map((issue) => ({
        sheet,
        rowNumber,
        field: issue.path.join(".") || "registro",
        message: issue.message,
      })),
    };
  });
}
