import { describe, expect, it } from "vitest";

import { parseApplyOptions } from "./cli-apply-guard";

describe("trava explícita de execução das CLIs Sheets", () => {
  it("usa simulação como padrão", () => {
    expect(parseApplyOptions([], "synthetic-id")).toEqual({ apply: false, dryRun: true });
  });

  it("só permite aplicar com confirmação exata do alvo", () => {
    expect(parseApplyOptions(["--apply", "--confirm-target=synthetic-id"], "synthetic-id")).toEqual({ apply: true, dryRun: false });
    expect(() => parseApplyOptions(["--apply"], "synthetic-id")).toThrow("mesmo ID");
    expect(() => parseApplyOptions(["--apply", "--confirm-target=other-id"], "synthetic-id")).toThrow("mesmo ID");
  });

  it("rejeita opções de execução ambíguas ou sem apply", () => {
    expect(() => parseApplyOptions(["--apply", "--dry-run", "--confirm-target=synthetic-id"], "synthetic-id")).toThrow("apenas um modo");
    expect(() => parseApplyOptions(["--confirm-target=synthetic-id"], "synthetic-id")).toThrow("junto com --apply");
  });
});
