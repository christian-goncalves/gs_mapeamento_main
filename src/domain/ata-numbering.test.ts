import { describe, expect, it } from "vitest";
import type { AggregatedAta } from "./aggregate";
import { deriveAtaNumbers } from "./ata-numbering";

const group = {
  grupo_id: "grupo-1",
  grupo_nome: "Grupo",
  ultima_reuniao_anterior: 10,
};

function ata(
  ataId: string,
  date: string,
  time: string,
  statusRegistro: "ativa" | "substituida" | "excluida" = "ativa",
): AggregatedAta {
  return {
    grupo: group as AggregatedAta["grupo"],
    registro: {
      ata: {
        ata_id: ataId,
        data_reuniao: date,
        hora_inicio: time,
        status_registro: statusRegistro,
      },
    } as AggregatedAta["registro"],
  } as AggregatedAta;
}

describe("numeração derivada das atas", () => {
  it("ordena por data e horário e aplica o deslocamento do grupo", () => {
    const result = deriveAtaNumbers([
      ata("ata-2", "2026-03-08", "20:00"),
      ata("ata-1", "2026-03-01", "20:00"),
      ata("ata-3", "2026-03-15", "20:00"),
    ]);

    expect([...result.entries()]).toEqual([
      ["ata-1", 11],
      ["ata-2", 12],
      ["ata-3", 13],
    ]);
  });

  it("exclui atas substituídas e excluídas da contagem", () => {
    const result = deriveAtaNumbers([
      ata("ata-1", "2026-03-01", "20:00"),
      ata("ata-2", "2026-03-08", "20:00", "excluida"),
      ata("ata-3", "2026-03-15", "20:00"),
    ]);

    expect(result.get("ata-1")).toBe(11);
    expect(result.get("ata-2")).toBeUndefined();
    expect(result.get("ata-3")).toBe(12);
  });
});
