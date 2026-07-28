import { describe, expect, it } from "vitest";
import {
  buildAtaNameSuggestionsDocument,
  mergeAtaNameSuggestions,
  uniqueSortedAtaNameSuggestions,
} from "./ata-name-suggestions";

const groupA = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
const groupB = "54015b3b-aa07-4d53-bde4-7498c8d7c1b8";

describe("sugestões de nomes por grupo", () => {
  it("remove vazios, normaliza espaços, deduplica e ordena", () => {
    expect(
      uniqueSortedAtaNameSuggestions([
        "  Maria   Silva ",
        "",
        "mária silva",
        "Ana",
        null,
      ]),
    ).toEqual(["Ana", "Maria Silva"]);
  });

  it("atualiza preenchido por e servidores preservando isolamento por grupo", () => {
    const document = buildAtaNameSuggestionsDocument([
      {
        grupo_id: groupA,
        preenchido_por: "Patricia",
        servidores: ["Hércules", "Ana"],
      },
      {
        grupo_id: groupB,
        preenchido_por: "Patricia",
        servidores: ["Hércules"],
      },
    ], "2026-07-19T12:00:00.000Z");

    const next = mergeAtaNameSuggestions(document, {
      grupo_id: groupA,
      preenchido_por: " patricia ",
      servidores: ["ana", "Carlos", ""],
    }, "2026-07-19T13:00:00.000Z");

    expect(next.groups[groupA]).toMatchObject({
      preenchido_por: ["Patricia"],
      servidores: ["Ana", "Carlos", "Hércules"],
    });
    expect(next.groups[groupB]).toMatchObject({
      preenchido_por: ["Patricia"],
      servidores: ["Hércules"],
    });
  });
});
