import { describe, expect, it } from "vitest";
import {
  ataFormSchema,
  participacaoFormSchema,
  visitanteFormSchema,
} from "./form-schemas";

describe("schemas de formulário", () => {
  it("aceita códigos internos sem campos de persistência", () => {
    expect(
      ataFormSchema.safeParse({
        grupo_id: "fccced1d-92a5-4d24-b5af-da65cbbe467f",
        data_reuniao: "2026-06-21",
        hora_inicio: "20:30",
        plataforma: "zoom",
        tipo_reuniao: "fechada",
        formatos: ["estudo"],
        total_membros_presentes: 0,
      }).success,
    ).toBe(true);
  });

  it("aplica a regra de estado também na entrada", () => {
    expect(
      participacaoFormSchema.safeParse({
        localidade: "Lisboa",
        estado: "LX",
        pais: "Portugal",
        presencas: 1,
      }).success,
    ).toBe(false);
  });

  it("valida visitante com a mesma base municipal do runtime", () => {
    expect(
      visitanteFormSchema.safeParse({
        nome: "Pessoa",
        cidade: "Inexistente - SP",
        categoria: "outro",
        origem_contato: "outro",
      }).success,
    ).toBe(false);
  });
});
