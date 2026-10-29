import { describe, expect, it } from "vitest";
import {
  parseResponsavelAtasFilters,
  responsavelAtasFiltersSessionKey,
  type ResponsavelAtasFilters,
} from "./responsavel-atas-filters-session";

const defaults: ResponsavelAtasFilters = {
  startDate: "2026-10-01",
  endDate: "2026-10-25",
  weekday: "todos",
  time: "todos",
  status: "todos",
};

describe("sessão dos filtros de atas do responsável", () => {
  it("isola os filtros por grupo e pelo modo da listagem", () => {
    expect(responsavelAtasFiltersSessionKey({ groupId: "grupo-1", historyMode: false }))
      .toBe("gs-mapeamento:responsavel-atas:filtros:grupo-1:atuais");
    expect(responsavelAtasFiltersSessionKey({ groupId: "grupo-1", historyMode: true }))
      .toBe("gs-mapeamento:responsavel-atas:filtros:grupo-1:historico");
  });

  it("restaura todos os filtros válidos da aba aberta", () => {
    const stored: ResponsavelAtasFilters = {
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      weekday: "Quarta",
      time: "21:30",
      status: "Enviada",
    };

    expect(parseResponsavelAtasFilters(JSON.stringify(stored), defaults)).toEqual(stored);
  });

  it("retorna ao padrão quando não há estado válido na sessão", () => {
    expect(parseResponsavelAtasFilters(null, defaults)).toEqual(defaults);
    expect(parseResponsavelAtasFilters("{inválido", defaults)).toEqual(defaults);
    expect(parseResponsavelAtasFilters(JSON.stringify({
      ...defaults,
      startDate: "ontem",
      status: "desconhecido",
    }), defaults)).toEqual(defaults);
  });
});
