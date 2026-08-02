import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthorizedSession: vi.fn(),
  readAggregatedAtas: vi.fn(),
  canAccessGroup: vi.fn(),
  buildAtaPresentation: vi.fn(),
  renderAtaPdf: vi.fn(),
  sendAtaPdfEmail: vi.fn(),
}));

vi.mock("@/lib/auth/require-session", () => ({ requireAuthorizedSession: mocks.requireAuthorizedSession }));
vi.mock("@/lib/sheets/repository", () => ({ readAggregatedAtas: mocks.readAggregatedAtas }));
vi.mock("@/lib/auth/access", () => ({ canAccessGroup: mocks.canAccessGroup }));
vi.mock("@/app/atas/ata-presentation", () => ({ buildAtaPresentation: mocks.buildAtaPresentation }));
vi.mock("@/lib/pdf/ata-pdf-document", () => ({ renderAtaPdf: mocks.renderAtaPdf }));
vi.mock("@/lib/email/ata-pdf-email", () => ({ sendAtaPdfEmail: mocks.sendAtaPdfEmail }));

import { POST } from "./route";

const requestId = "7d750cc9-7e55-491a-87e5-6337e52686ac";
const item = { grupo: { grupo_id: "group-1" }, registro: { ata: { ata_id: "ata-1" } } };

function request(body: unknown) {
  return new Request("http://localhost/api/atas/ata-1/pdf/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/atas/:ataId/pdf/email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthorizedSession.mockResolvedValue({ access: { role: "responsavel_grupo" } });
    mocks.readAggregatedAtas.mockResolvedValue({ atas: [item] });
    mocks.canAccessGroup.mockReturnValue(true);
    mocks.buildAtaPresentation.mockReturnValue({ ataId: "ata-1" });
    mocks.renderAtaPdf.mockResolvedValue(Buffer.from("pdf"));
    mocks.sendAtaPdfEmail.mockResolvedValue({ id: "email-1" });
  });

  it("valida o destinatário antes de gerar", async () => {
    const response = await POST(request({ recipient: "invalido", requestId }), {
      params: Promise.resolve({ ataId: "ata-1" }),
    });
    expect(response.status).toBe(400);
    expect(mocks.renderAtaPdf).not.toHaveBeenCalled();
  });

  it("revalida o acesso ao grupo", async () => {
    mocks.canAccessGroup.mockReturnValue(false);
    const response = await POST(request({ recipient: "destino@example.com", requestId }), {
      params: Promise.resolve({ ataId: "ata-1" }),
    });
    expect(response.status).toBe(404);
    expect(mocks.sendAtaPdfEmail).not.toHaveBeenCalled();
  });

  it("envia o mesmo PDF com chave idempotente", async () => {
    const response = await POST(request({ recipient: "destino@example.com", requestId }), {
      params: Promise.resolve({ ataId: "ata-1" }),
    });
    expect(response.status).toBe(200);
    expect(mocks.sendAtaPdfEmail).toHaveBeenCalledWith(expect.objectContaining({
      recipient: "destino@example.com",
      requestId,
      pdf: Buffer.from("pdf"),
    }));
  });

  it("retorna falha segura quando o provedor rejeita", async () => {
    mocks.sendAtaPdfEmail.mockRejectedValue(new Error("segredo do provedor"));
    const response = await POST(request({ recipient: "destino@example.com", requestId }), {
      params: Promise.resolve({ ataId: "ata-1" }),
    });
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "Não foi possível enviar o PDF. Tente novamente." });
  });
});
