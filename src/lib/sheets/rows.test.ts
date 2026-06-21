import { describe, expect, it } from "vitest";
import { rowsToObjects } from "./rows";

describe("linhas do Sheets", () => {
  it("recusa cabeçalhos fora do contrato", () => {
    expect(() => rowsToObjects(["id", "nome"], [["nome", "id"]])).toThrow("Cabeçalho inválido");
  });

  it("mapeia células pela ordem do cabeçalho", () => {
    expect(rowsToObjects(["id", "nome"], [["id", "nome"], ["1", "Grupo"]])).toEqual([{ id: "1", nome: "Grupo" }]);
  });
});
