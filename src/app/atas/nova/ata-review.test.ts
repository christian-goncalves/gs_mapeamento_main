import { describe, expect, it } from "vitest";
import { formatReviewDate, getReviewMetricCounts } from "./ata-review";

describe("resumo da ata", () => {
  it("apresenta a data brasileira sem alterar o valor persistido", () => {
    expect(formatReviewDate("2026-07-31")).toBe("31/07/2026");
    expect(formatReviewDate("data inválida")).toBe("data inválida");
  });

  it("calcula os seis indicadores a partir das coleções exibidas", () => {
    expect(getReviewMetricCounts({
      servidores: [{}],
      participacao: [{}, {}],
      membros_internacionais: [{}],
      visitantes: [],
      ingressos: [],
    }, 3)).toEqual({
      servidores: 1,
      localidades: 2,
      membrosInternacionais: 1,
      visitantes: 0,
      ingressos: 0,
      conquistasTempo: 3,
    });
  });
});
