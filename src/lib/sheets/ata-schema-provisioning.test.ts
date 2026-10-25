import { describe, expect, it, vi } from "vitest";

import { SHEET_HEADERS } from "./contract";
import { compatibleHeaders, V2_NEW_SHEET_HEADERS } from "./contract-v2";
import {
  provisionAtaGroupSchema,
  type ContractReconciliationClient,
} from "./contract-reconciliation";

const spreadsheetId = "synthetic-sheet-id";
const v1ScheduleHeaders = [...SHEET_HEADERS.grupo_horarios];
const v2ScheduleHeaders = [...compatibleHeaders("grupo_horarios")];
const platformHeaders = [...V2_NEW_SHEET_HEADERS.grupo_plataformas];

function fakeClient(options: {
  platformExists?: boolean;
  scheduleHeaders?: unknown[];
  platformHeaders?: unknown[];
  onBatchUpdate?: () => void;
  batchError?: Error;
  readbackHeaders?: Partial<Record<string, unknown[]>>;
} = {}) {
  let applied = false;
  const batchUpdate = vi.fn(async () => {
    if (options.batchError) throw options.batchError;
    applied = true;
    options.onBatchUpdate?.();
  });
  const sheets = [
    { properties: { title: "grupo_horarios", sheetId: 2, gridProperties: { rowCount: 1000 } } },
    ...(options.platformExists ? [{ properties: { title: "grupo_plataformas", sheetId: 3, gridProperties: { rowCount: 1000 } } }] : []),
  ];
  const get = vi.fn(async () => ({ data: { properties: { title: "synthetic target" }, sheets } }));
  const valuesGet = vi.fn(async ({ range }: { spreadsheetId: string; range: string }) => {
    const sheetName = range.split("!")[0];
    if (applied && options.readbackHeaders?.[sheetName]) {
      return { data: { values: [options.readbackHeaders[sheetName]!] } };
    }
    if (applied && range.includes("grupo_plataformas")) return { data: { values: [platformHeaders] } };
    if (applied && range.includes("grupo_horarios")) return { data: { values: [v2ScheduleHeaders] } };
    if (sheetName === "grupo_horarios") return { data: { values: [options.scheduleHeaders ?? v1ScheduleHeaders] } };
    return { data: { values: [options.platformHeaders ?? platformHeaders] } };
  });
  const client = { spreadsheets: { get, values: { get: valuesGet }, batchUpdate } } as unknown as ContractReconciliationClient;
  return { client, get, valuesGet, batchUpdate };
}

describe("provisionamento sintético do schema de grupo novo", () => {
  it("simula schema ausente sem chamar batchUpdate e lê só os dois cabeçalhos necessários", async () => {
    const { client, valuesGet, batchUpdate } = fakeClient();
    const result = await provisionAtaGroupSchema(client, spreadsheetId);

    expect(result).toMatchObject({
      spreadsheetTitle: "synthetic target",
      createdSheets: ["grupo_plataformas"],
      addedColumns: [{ sheet: "grupo_horarios", column: "plataforma_id" }],
      requestCount: 4,
      applied: false,
    });
    expect(batchUpdate).not.toHaveBeenCalled();
    expect(valuesGet.mock.calls.map(([call]) => call.range)).toEqual([
      "grupo_horarios!1:1",
    ]);
  });

  it("aplica a estrutura ausente em um único batch e valida readback dos cabeçalhos alterados", async () => {
    const { client, batchUpdate } = fakeClient();
    const result = await provisionAtaGroupSchema(client, spreadsheetId, { apply: true });

    expect(batchUpdate).toHaveBeenCalledTimes(1);
    expect(batchUpdate.mock.calls[0][0].requestBody.requests).toHaveLength(4);
    expect(result.applied).toBe(true);
    expect(result.createdSheets).toEqual(["grupo_plataformas"]);
  });

  it("não escreve quando o schema já está correto", async () => {
    const { client, batchUpdate } = fakeClient({ platformExists: true, scheduleHeaders: v2ScheduleHeaders });
    const result = await provisionAtaGroupSchema(client, spreadsheetId, { apply: true });

    expect(result.requestCount).toBe(0);
    expect(result.applied).toBe(false);
    expect(batchUpdate).not.toHaveBeenCalled();
  });

  it.each([
    ["duplicado", [...v1ScheduleHeaders, "plataforma_id", "plataforma_id"]],
    ["incompatível", ["horario_id", "grupo_id", "dia_semana"]],
    ["extensão não contratada", [...v1ScheduleHeaders, "plataforma_id", "vigente_desde", "vigente_ate"]],
  ])("interrompe antes de escrever quando grupo_horarios tem cabeçalho %s", async (_case, scheduleHeaders) => {
    const { client, batchUpdate } = fakeClient({ scheduleHeaders });

    await expect(provisionAtaGroupSchema(client, spreadsheetId, { apply: true })).rejects.toThrow("Cabeçalho");
    expect(batchUpdate).not.toHaveBeenCalled();
  });

  it("valida também a aba existente de plataformas antes de qualquer escrita", async () => {
    const wrongPlatformHeaders = [...platformHeaders].reverse();
    const { client, batchUpdate } = fakeClient({
      platformExists: true,
      platformHeaders: wrongPlatformHeaders,
      scheduleHeaders: v1ScheduleHeaders,
    });

    await expect(provisionAtaGroupSchema(client, spreadsheetId, { apply: true })).rejects.toThrow("Cabeçalho");
    expect(batchUpdate).not.toHaveBeenCalled();
  });

  it("trata erro do batchUpdate como incerto e nunca repete automaticamente", async () => {
    const { client, batchUpdate } = fakeClient({ batchError: new Error("timeout") });

    await expect(provisionAtaGroupSchema(client, spreadsheetId, { apply: true })).rejects.toThrow("resultado incerto");
    expect(batchUpdate).toHaveBeenCalledTimes(1);
  });

  it("interrompe quando o readback não confirma os cabeçalhos alterados", async () => {
    const { client, batchUpdate } = fakeClient({
      readbackHeaders: { grupo_horarios: v1ScheduleHeaders },
    });

    await expect(provisionAtaGroupSchema(client, spreadsheetId, { apply: true })).rejects.toThrow("readback de grupo_horarios divergiu");
    expect(batchUpdate).toHaveBeenCalledTimes(1);
  });
});
