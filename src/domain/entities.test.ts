import { describe, expect, it } from "vitest";
import { ataSchema, grupoSchema, participacaoSchema } from "./entities";

const audit = { created_at: "2026-06-21T12:00:00.000Z", updated_at: "2026-06-21T12:00:00.000Z" };

describe("schemas das entidades", () => {
  it("converte tipos vindos do Sheets em grupos", () => {
    const group = grupoSchema.parse({
      grupo_id: "fccced1d-92a5-4d24-b5af-da65cbbe467f", zoom_id: "001", grupo_nome: "Grupo",
      ordem: "2", ativo: "TRUE", ...audit,
    });
    expect(group).toMatchObject({ zoom_id: "001", ordem: 2, ativo: true });
  });

  it("exige ao menos um formato e intervalo de meia hora", () => {
    const result = ataSchema.safeParse({
      ata_id: "93ef9660-8c64-4b51-9bc5-09069ce629c1", grupo_id: "fccced1d-92a5-4d24-b5af-da65cbbe467f",
      data_reuniao: "2026-06-21", hora_inicio: "10:15", plataforma: "Zoom", tipo_reuniao: "aberta",
      formato_partilha: "FALSE", formato_estudo: "FALSE", formato_tematico: "FALSE",
      formato_literatura: "FALSE", formato_passos: "FALSE", formato_tradicoes: "FALSE",
      total_membros_presentes: "3", ...audit,
    });
    expect(result.success).toBe(false);
  });

  it("exige estado para participação brasileira", () => {
    const result = participacaoSchema.safeParse({
      participacao_id: "e7918765-a98d-46bf-86f8-e6deef3190a2", ata_id: "93ef9660-8c64-4b51-9bc5-09069ce629c1",
      localidade: "Salvador", estado: "", pais: "Brasil", presencas: "1", ...audit,
    });
    expect(result.success).toBe(false);
  });
});
