import { describe, expect, it } from "vitest";

import { filterTextSuggestions } from "./text-autocomplete";

describe("autocomplete de nomes", () => {
  const suggestions = ["ALISSON", "CHRISTIAN", "GONCALVES", "PEREIRA"];

  it.each([
    ["a", ["ALISSON"]],
    ["c", ["CHRISTIAN"]],
    ["g", ["GONCALVES"]],
    ["p", ["PEREIRA"]],
  ])("filtra por prefixo desde a primeira letra %s", (value, expected) => {
    expect(filterTextSuggestions(suggestions, value)).toEqual(expected);
  });

  it("ignora caixa e acentos sem selecionar um valor", () => {
    expect(filterTextSuggestions(["HÉRCULES"], "he")).toEqual(["HÉRCULES"]);
  });
});
