import { describe, expect, it } from "vitest";
import {
  assertUniqueAtaCustomIndex,
  DuplicateAtaCustomIndexError,
  nextAtaCreationIdentifiers,
} from "./ata-identifiers";

const groupA = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
const groupB = "2bed9d1b-7fea-4cf4-9497-f0ccbcead41c";

describe("identificadores de ata por grupo", () => {
  it("gera primeiro sequencial e índice do grupo", () => {
    expect(nextAtaCreationIdentifiers(groupA, [])).toEqual({
      numero_sequencial_grupo: 1,
      indice_personalizado_grupo: 1,
    });
  });

  it("incrementa somente considerando atas do próprio grupo", () => {
    expect(
      nextAtaCreationIdentifiers(groupA, [
        {
          ata_id: "93ef9660-8c64-4b51-9bc5-09069ce629c1",
          grupo_id: groupA,
          numero_sequencial_grupo: 1,
          indice_personalizado_grupo: 3,
        },
        {
          ata_id: "dbca5f07-744f-4e9f-9169-f7f66d4cbbcc",
          grupo_id: groupB,
          numero_sequencial_grupo: 7,
          indice_personalizado_grupo: 1,
        },
      ]),
    ).toEqual({
      numero_sequencial_grupo: 2,
      indice_personalizado_grupo: 2,
    });
  });

  it("rejeita índice duplicado no mesmo grupo e aceita em outro grupo", () => {
    const existing = [
      {
        ata_id: "93ef9660-8c64-4b51-9bc5-09069ce629c1",
        grupo_id: groupA,
        numero_sequencial_grupo: 1,
        indice_personalizado_grupo: 1,
      },
    ];
    expect(() => assertUniqueAtaCustomIndex(groupA, 1, existing)).toThrow(
      DuplicateAtaCustomIndexError,
    );
    expect(() => assertUniqueAtaCustomIndex(groupB, 1, existing)).not.toThrow();
  });
});
