import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseRows, rowsToObjects } from "./rows";

describe("linhas do Sheets", () => {
  it("recusa cabeçalhos fora do contrato", () => {
    expect(() => rowsToObjects(["id", "nome"], [["nome", "id"]])).toThrow("Cabeçalho inválido");
  });

  it("mapeia células pela ordem do cabeçalho", () => {
    expect(rowsToObjects(["id", "nome"], [["id", "nome"], ["1", "Grupo"]])).toEqual([
      { rowNumber: 2, value: { id: "1", nome: "Grupo" } },
    ]);
  });

  it("preserva o número real depois de linhas vazias", () => {
    const rows = rowsToObjects(
      ["id"],
      [["id"], ["1"], [""], ["invalido"]],
    );
    const parsed = parseRows("grupos", z.object({ id: z.string().uuid() }), rows);
    expect(parsed[1]).toMatchObject({
      valid: false,
      sheet: "grupos",
      rowNumber: 4,
      diagnostics: [{ sheet: "grupos", rowNumber: 4, field: "id" }],
    });
  });
});
