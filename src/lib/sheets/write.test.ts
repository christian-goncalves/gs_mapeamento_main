import { describe, expect, it, vi } from "vitest";
import type { AtaCompleta } from "@/domain/rules";
import { buildAtomicAppendRequests, executeAtomicBatch } from "./write";

const ataId = "93ef9660-8c64-4b51-9bc5-09069ce629c1";
const audit = {
  created_at: "2026-06-22T12:00:00.000Z",
  updated_at: "2026-06-22T12:00:00.000Z",
};
const registro: AtaCompleta = {
  ata: {
    ata_id: ataId,
    grupo_id: "fccced1d-92a5-4d24-b5af-da65cbbe467f",
    data_reuniao: "2026-06-22",
    hora_inicio: "20:30",
    plataforma: "zoom",
    tipo_reuniao: "aberta",
    formatos: ["partilha"],
    total_membros_presentes: 1,
    ...audit,
  },
  servidores: [
    {
      servidor_id: "a4e54dd9-8e3f-4d56-a932-00ea5c13fc88",
      ata_id: ataId,
      nome: "Servidor",
      ordem: 1,
      ...audit,
    },
  ],
  participacao: [
    {
      participacao_id: "e7918765-a98d-46bf-86f8-e6deef3190a2",
      ata_id: ataId,
      localidade: "Salvador",
      estado: "BA",
      pais: "Brasil",
      presencas: 1,
      ...audit,
    },
  ],
  visitantes: [
    {
      visitante_id: "a86f8bc3-e943-48e8-8853-cabbb41ab071",
      ata_id: ataId,
      nome: "Visitante",
      cidade: "São Paulo - SP",
      categoria: "outro",
      origem_contato: "internet",
      ...audit,
    },
  ],
  trocas_chaveiro: [
    {
      troca_chaveiro_id: "e13f1e7e-e67e-4482-a5e0-897bb52a50d5",
      ata_id: ataId,
      tempo_limpo: "dias_30",
      ...audit,
    },
  ],
};
const sheetIds = {
  grupos: 0,
  atas: 1,
  servidores: 2,
  participacao: 3,
  visitantes: 4,
  trocas_chaveiro: 5,
};

describe("lote atômico do Sheets", () => {
  it("gera um append por aba não vazia no mesmo lote", () => {
    const requests = buildAtomicAppendRequests(registro, sheetIds);
    expect(requests).toHaveLength(5);
    expect(requests.map((request) => request.appendCells?.sheetId)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(
      requests[0].appendCells?.rows?.[0]?.values?.[2]?.userEnteredValue,
    ).toEqual({ numberValue: 46195 });
    expect(
      requests[0].appendCells?.rows?.[0]?.values?.[4]?.userEnteredValue,
    ).toEqual({ stringValue: "Zoom" });
    expect(
      requests[3].appendCells?.rows?.[0]?.values?.[4]?.userEnteredValue,
    ).toEqual({ stringValue: "Outro" });
    expect(
      requests[4].appendCells?.rows?.[0]?.values?.[2]?.userEnteredValue,
    ).toEqual({ stringValue: "30 dias" });
  });

  it("faz uma única chamada e só resolve após confirmação da API", async () => {
    let confirm: (() => void) | undefined;
    const batchUpdate = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          confirm = resolve;
        }),
    );
    const pending = executeAtomicBatch(
      { spreadsheets: { batchUpdate } },
      "test-sheet",
      buildAtomicAppendRequests(registro, sheetIds),
    );
    expect(batchUpdate).toHaveBeenCalledTimes(1);
    let settled = false;
    pending.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    confirm?.();
    await pending;
    expect(settled).toBe(true);
  });

  it("propaga falha do lote sem executar escritas separadas", async () => {
    const batchUpdate = vi.fn().mockRejectedValue(new Error("Falha simulada"));
    await expect(
      executeAtomicBatch(
        { spreadsheets: { batchUpdate } },
        "test-sheet",
        buildAtomicAppendRequests(registro, sheetIds),
      ),
    ).rejects.toThrow("Falha simulada");
    expect(batchUpdate).toHaveBeenCalledTimes(1);
  });
});
