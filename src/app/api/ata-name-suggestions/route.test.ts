import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAtaNameSuggestionsByGroup: vi.fn(),
  listRecentServerNamesByGroup: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ata-name-suggestions.server", () => ({
  getAtaNameSuggestionsByGroup: mocks.getAtaNameSuggestionsByGroup,
}));
vi.mock("@/lib/sheets/repository", () => ({
  listRecentServerNamesByGroup: mocks.listRecentServerNamesByGroup,
}));

import { GET } from "./route";

const groupId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";

describe("API de sugestões de nomes de ata", () => {
  it("rejeita grupo_id inválido", async () => {
    const response = await GET(
      new Request("http://localhost/api/ata-name-suggestions?grupo_id=invalido"),
    );
    await expect(response.json()).resolves.toEqual({ error: "grupo_id inválido." });
    expect(response.status).toBe(400);
    expect(mocks.getAtaNameSuggestionsByGroup).not.toHaveBeenCalled();
  });

  it("retorna sugestões do grupo informado", async () => {
    mocks.getAtaNameSuggestionsByGroup.mockResolvedValue({
      preenchido_por: ["Patricia"],
      servidores: ["Hércules"],
      updatedAt: "2026-07-19T12:00:00.000Z",
    });
    mocks.listRecentServerNamesByGroup.mockResolvedValue(["Brusque", "Hércules"]);

    const response = await GET(
      new Request(`http://localhost/api/ata-name-suggestions?grupo_id=${groupId}`),
    );

    await expect(response.json()).resolves.toEqual({
      suggestions: {
        preenchido_por: ["Patricia"],
        servidores: ["Brusque", "Hércules"],
        updatedAt: "2026-07-19T12:00:00.000Z",
      },
    });
    expect(mocks.getAtaNameSuggestionsByGroup).toHaveBeenCalledWith(groupId);
    expect(mocks.listRecentServerNamesByGroup).toHaveBeenCalledWith(groupId);
  });
});
