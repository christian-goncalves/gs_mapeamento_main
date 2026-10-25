import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  saveHorariosGrupoAction: vi.fn(),
  toggleHorarioAction: vi.fn(),
}));

import { canReviewSchedules } from "./group-schedules-editor";

describe("habilitação da confirmação de horários", () => {
  it("permite revisar o primeiro horário completo sem exigir Adicionar", () => {
    expect(
      canReviewSchedules(0, { dia_semana: "domingo", hora_inicio: "05:30" }, false),
    ).toBe(true);
  });

  it("mantém a confirmação desabilitada quando não há horário completo", () => {
    expect(canReviewSchedules(0, { dia_semana: "domingo", hora_inicio: "" }, false)).toBe(false);
    expect(canReviewSchedules(0, { dia_semana: "", hora_inicio: "" }, false)).toBe(false);
  });

  it("permite revisar horários existentes e bloqueia linhas duplicadas", () => {
    expect(canReviewSchedules(1, { dia_semana: "", hora_inicio: "" }, false)).toBe(true);
    expect(canReviewSchedules(1, { dia_semana: "", hora_inicio: "" }, true)).toBe(false);
  });
});
