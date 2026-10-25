import { describe, expect, it } from "vitest";
import {
  encodeResponsavelAtasOrder,
  RESPONSAVEL_ATAS_INITIAL_ORDER,
  RESPONSAVEL_ATAS_INITIAL_ORDER_QUERY,
} from "./responsavel-atas-order";

describe("ordenação da listagem de atas do responsável", () => {
  it("abre com data mais recente e horário mais recente dentro do mesmo dia", () => {
    expect(RESPONSAVEL_ATAS_INITIAL_ORDER).toEqual([
      [1, "desc"],
      [2, "desc"],
    ]);
    expect(RESPONSAVEL_ATAS_INITIAL_ORDER_QUERY).toBe("1.desc,2.desc");
  });

  it("preserva a codificação das ordenações escolhidas pelo usuário", () => {
    expect(encodeResponsavelAtasOrder([[1, "asc"], [2, 1]])).toBe(
      "1.asc,2.asc",
    );
    expect(encodeResponsavelAtasOrder([[0, "desc"]])).toBe("0.desc");
  });
});
