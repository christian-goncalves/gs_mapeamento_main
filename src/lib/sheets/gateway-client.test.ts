import { createHash, createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createSheetRangeGuard,
  executeGatewayOperation,
  hashSheetValues,
} from "./gateway-client";
import { canonicalJson } from "./operation-envelope";

describe("cliente autenticado do gateway Sheets", () => {
  beforeEach(() => {
    process.env.SHEETS_GATEWAY_URL = "https://script.example.test/exec";
    process.env.SHEETS_GATEWAY_HMAC_SECRET = "synthetic-secret";
  });

  afterEach(() => {
    delete process.env.SHEETS_GATEWAY_URL;
    delete process.env.SHEETS_GATEWAY_HMAC_SECRET;
    vi.unstubAllGlobals();
  });

  it("assina o envelope canônico e envia apenas pelo cliente server-side", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, existing: false }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await executeGatewayOperation({
      operacaoId: "68b36d78-1a5e-4e9f-b4a2-b518c28c9e82",
      tipo: "validacao_sintetica",
      payload: {
        actor: "teste-sintetico",
        intent: { id: "intent-1" },
        requests: [{ updateCells: { range: { sheetId: 1 } } }],
        guards: [{ range: "grupos!A:P", sha256: "0".repeat(64) }],
        quantidade_atas: 1,
      },
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    const expected = createHmac("sha256", "synthetic-secret")
      .update(`${body.timestamp}.${canonicalJson(body.operation)}`)
      .digest("base64url");
    expect(url).toBe(process.env.SHEETS_GATEWAY_URL);
    expect(init.method).toBe("POST");
    expect(body.signature).toBe(expected);
    expect(init.cache).toBe("no-store");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("usa o mesmo SHA-256 para os guards que o gateway recalcula", () => {
    const values = [["grupo_id", "grupo_nome"], ["sintetico", "Teste"]];
    const expected = createHash("sha256").update(canonicalJson(values)).digest("hex");
    expect(hashSheetValues(values)).toBe(expected);
    expect(createSheetRangeGuard("grupos!A:P", values)).toEqual({
      range: "grupos!A:P",
      sha256: expected,
    });
  });

  it("reporta resultado indeterminado com o mesmo operacao_id se a conexão cair", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      executeGatewayOperation({
        operacaoId: "68b36d78-1a5e-4e9f-b4a2-b518c28c9e82",
        tipo: "validacao_sintetica",
        payload: {
          actor: "teste-sintetico",
          intent: { id: "intent-1" },
          requests: [{ updateCells: { range: { sheetId: 1 } } }],
          guards: [{ range: "grupos!A:P", sha256: "0".repeat(64) }],
          quantidade_atas: 1,
        },
      }),
    ).rejects.toThrow("68b36d78-1a5e-4e9f-b4a2-b518c28c9e82");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body));
    const secondBody = JSON.parse(String((fetchMock.mock.calls[1]?.[1] as RequestInit).body));
    expect(firstBody).toHaveProperty("operation");
    expect(secondBody).toHaveProperty("query");
  });

  it("reconcilia automaticamente como aplicada quando timeout é seguido por ledger concluído", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error("timeout after send"))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        ok: true,
        state: "aplicada",
        safe_to_retry: false,
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await executeGatewayOperation({
      operacaoId: "68b36d78-1a5e-4e9f-b4a2-b518c28c9e82",
      tipo: "validacao_sintetica",
      payload: {
        actor: "teste-sintetico",
        intent: { id: "intent-1" },
        requests: [{ updateCells: { range: { sheetId: 1 } } }],
        guards: [{ range: "grupos!A:P", sha256: "0".repeat(64) }],
        quantidade_atas: 1,
      },
    });
    expect(result).toMatchObject({ reconciled: true, existing: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(url).toBe(process.env.SHEETS_GATEWAY_URL);
    expect(body.query.operacao_id).toBe(result.operacao_id);
    expect(body.signature).toBe(createHmac("sha256", "synthetic-secret")
      .update(`${body.timestamp}.${canonicalJson(body.query)}`)
      .digest("base64url"));
  });

  it("não permite repetição automática quando o ledger ainda não encontra a operação", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error("timeout after send"))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        ok: true,
        state: "nao_encontrada",
        safe_to_retry: false,
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(executeGatewayOperation({
      operacaoId: "68b36d78-1a5e-4e9f-b4a2-b518c28c9e82",
      tipo: "validacao_sintetica",
      payload: {
        actor: "teste-sintetico",
        intent: { id: "intent-1" },
        requests: [{ updateCells: { range: { sheetId: 1 } } }],
        guards: [{ range: "grupos!A:P", sha256: "0".repeat(64) }],
        quantidade_atas: 1,
      },
    })).rejects.toThrow(/nao_encontrada.*não repita automaticamente/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
