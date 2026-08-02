import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthorizedSession: vi.fn(),
  readAggregatedAtas: vi.fn(),
  canAccessGroup: vi.fn(),
  buildAtaPresentation: vi.fn(),
  renderAtaPdf: vi.fn(),
}));

vi.mock("@/lib/auth/require-session", () => ({ requireAuthorizedSession: mocks.requireAuthorizedSession }));
vi.mock("@/lib/sheets/repository", () => ({ readAggregatedAtas: mocks.readAggregatedAtas }));
vi.mock("@/lib/auth/access", () => ({ canAccessGroup: mocks.canAccessGroup }));
vi.mock("@/app/atas/ata-presentation", () => ({ buildAtaPresentation: mocks.buildAtaPresentation }));
vi.mock("@/lib/pdf/ata-pdf-document", () => ({ renderAtaPdf: mocks.renderAtaPdf }));

import { GET } from "./route";

const item = {
  grupo: { grupo_id: "group-1" },
  registro: { ata: { ata_id: "ata-1" } },
};

describe("GET /api/atas/:ataId/pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthorizedSession.mockResolvedValue({ access: { role: "administrador" } });
    mocks.readAggregatedAtas.mockResolvedValue({ atas: [item] });
    mocks.canAccessGroup.mockReturnValue(true);
    mocks.buildAtaPresentation.mockReturnValue({ filename: "ata-usl.pdf" });
    mocks.renderAtaPdf.mockResolvedValue(Buffer.from("pdf"));
  });

  it("abre o PDF inline por padrão", async () => {
    const response = await GET(new Request("http://localhost/api/atas/ata-1/pdf"), {
      params: Promise.resolve({ ataId: "ata-1" }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe('inline; filename="ata-usl.pdf"');
  });

  it("oferece download explícito", async () => {
    const response = await GET(new Request("http://localhost/api/atas/ata-1/pdf?download=1"), {
      params: Promise.resolve({ ataId: "ata-1" }),
    });
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="ata-usl.pdf"');
  });

  it("não revela ata sem acesso", async () => {
    mocks.canAccessGroup.mockReturnValue(false);
    const response = await GET(new Request("http://localhost/api/atas/ata-1/pdf"), {
      params: Promise.resolve({ ataId: "ata-1" }),
    });
    expect(response.status).toBe(404);
    expect(mocks.renderAtaPdf).not.toHaveBeenCalled();
  });
});
