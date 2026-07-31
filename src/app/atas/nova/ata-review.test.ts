import { describe, expect, it } from "vitest";
import {
  formatReviewDate,
  formatReviewLocation,
  getAtaDetailBackHref,
  getReviewMetricCounts,
} from "./ata-review";

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

  it("retorna para a listagem correspondente ao perfil autenticado", () => {
    expect(getAtaDetailBackHref("administrador")).toBe("/admin/atas");
    expect(getAtaDetailBackHref("responsavel_grupo")).toBe("/responsavel/atas");
  });

  it("exibe a UF ao lado da cidade sem incluir o país", () => {
    expect(formatReviewLocation("Itajaí", "SC")).toBe("Itajaí - SC");
    expect(formatReviewLocation("Lisboa", "")).toBe("Lisboa");
  });
});
