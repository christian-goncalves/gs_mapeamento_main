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

  it("aceita colunas finais ausentes somente quando a migração é permitida", () => {
    expect(
      rowsToObjects(
        ["id", "nome", "fuso_horario", "plataforma", "acesso_plataforma"],
        [["id", "nome"], ["1", "Grupo"]],
        { allowMissingTrailingHeaders: 3 },
      ),
    ).toEqual([{
      rowNumber: 2,
      value: {
        id: "1",
        nome: "Grupo",
        fuso_horario: "",
        plataforma: "",
        acesso_plataforma: "",
      },
    }]);
  });

  it("continua recusando coluna ausente sem permissão explícita", () => {
    expect(() => rowsToObjects(["id", "nome"], [["id"]])).toThrow("Cabeçalho inválido");
  });

  it("ignora linhas vazias com FALSE herdado de checkbox", () => {
    expect(
      rowsToObjects(
        ["id", "nome", "texto"],
        [["id", "nome", "texto"], ["", "", false], ["1", "Grupo", false]],
      ),
    ).toEqual([
      { rowNumber: 3, value: { id: "1", nome: "Grupo", texto: false } },
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
