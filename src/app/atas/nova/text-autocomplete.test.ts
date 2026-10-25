import { describe, expect, it } from "vitest";

import {
  filterTextSuggestions,
  nextAutocompleteIndex,
  selectedAutocompleteIndex,
} from "./text-autocomplete";

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

  it("navega ciclicamente pelas opções e confirma a primeira quando nada foi destacado", () => {
    expect(nextAutocompleteIndex(-1, "ArrowDown", 3)).toBe(0);
    expect(nextAutocompleteIndex(2, "ArrowDown", 3)).toBe(0);
    expect(nextAutocompleteIndex(0, "ArrowUp", 3)).toBe(2);
    expect(selectedAutocompleteIndex(-1, 3)).toBe(0);
    expect(selectedAutocompleteIndex(1, 3)).toBe(1);
    expect(selectedAutocompleteIndex(0, 0)).toBe(-1);
  });
});
