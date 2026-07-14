import { describe, expect, it, vi } from "vitest";
import { findFirstWritableGroupRow } from "./group-admin";

vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({
  getSpreadsheetId: () => "spreadsheet-test",
  getSheetsClient: () => ({}),
}));

describe("administração de grupos no Sheets", () => {
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
