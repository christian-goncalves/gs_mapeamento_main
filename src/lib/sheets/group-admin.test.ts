import { describe, expect, it, vi } from "vitest";
import { SHEET_HEADERS } from "./contract";
import {
  findFirstWritableGroupRow,
  groupAdminRowsToObjects,
} from "./group-admin";

vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({
  getSpreadsheetId: () => "spreadsheet-test",
  getSheetsClient: () => ({}),
}));

describe("administração de grupos no Sheets", () => {
  it("aceita grupos legados sem as três novas colunas finais", () => {
    const legacyHeaders = SHEET_HEADERS.grupos.slice(0, -3);

    expect(
      groupAdminRowsToObjects("grupos", [
        [...legacyHeaders],
        legacyHeaders.map((header) => header === "grupo_nome" ? "Bom dia" : ""),
      ]),
    ).toEqual([
      expect.objectContaining({
        rowNumber: 2,
        value: expect.objectContaining({
          grupo_nome: "Bom dia",
          fuso_horario: "",
          plataforma: "",
          acesso_plataforma: "",
        }),
      }),
    ]);
  });

  it("mantém estritas as demais diferenças de cabeçalho", () => {
    expect(() =>
      groupAdminRowsToObjects("grupo_horarios", [["horario_id"]]),
    ).toThrow("Cabeçalho inválido");
  });

  it("encontra a primeira linha sem identificadores reais, ignorando checkbox falso", () => {
    const rows = [
      ["grupo_id", "zoom_id", "grupo_nome", "ordem", "ativo"],
      ["id-1", "111", "Bom dia", 1, true],
      ["id-2", "222", "Coragem", 2, true],
      ["", "", "", "", false],
      ["", "", "", "", false],
    ];

    expect(findFirstWritableGroupRow(rows)).toBe(4);
  });

  it("usa a próxima linha quando não há linha vazia real", () => {
    const rows = [
      ["grupo_id", "zoom_id", "grupo_nome", "ordem", "ativo"],
      ["id-1", "111", "Bom dia", 1, true],
    ];

    expect(findFirstWritableGroupRow(rows)).toBe(3);
  });
});
