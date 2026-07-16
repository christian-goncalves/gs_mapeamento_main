import { describe, expect, it, vi } from "vitest";
import type { AtaCompleta } from "@/domain/rules";
import {
  buildAtomicWriteRequests,
  executeAtomicBatch,
  firstEmptyDataRowNumber,
} from "./write";

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
    duracao: "1:30",
    formato_outros: "",
    preenchido_por: "Patricia",
    plataforma: "zoom",
    tipo_reuniao: "aberta",
    formatos: ["partilha"],
    total_membros_presentes: 1,
    total_partilhas: 1,
    ...audit,
  },
  servidores: [
    {
      servidor_id: "a4e54dd9-8e3f-4d56-a932-00ea5c13fc88",
      ata_id: ataId,
      nome: "Servidor",
      funcao: "Secretário",
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
  ingressos: [
    {
      ingresso_id: "5c3e7ec5-1d30-4e92-a0fb-389d7afed99d",
      ata_id: ataId,
      nome: "Anonimo",
      cidade: "São Paulo - SP",
      ...audit,
    },
  ],
  trocas_chaveiro: [
    {
      troca_chaveiro_id: "e13f1e7e-e67e-4482-a5e0-897bb52a50d5",
      ata_id: ataId,
      tempo_limpo: "1M",
      quantidade: 2,
      ...audit,
    },
  ],
};
const sheetIds = {
  grupos: 0,
  atas: 1,
  grupo_horarios: 7,
  servidores: 2,
  participacao: 3,
  visitantes: 4,
  ingressos: 5,
  trocas_chaveiro: 6,
};

describe("lote atômico do Sheets", () => {
  const nextRows = {
    atas: 2,
    servidores: 3,
    participacao: 4,
    visitantes: 5,
    ingressos: 6,
    trocas_chaveiro: 7,
  };

  it("gera updates na primeira linha livre por aba no mesmo lote", () => {
    const requests = buildAtomicWriteRequests(registro, sheetIds, nextRows);
    expect(requests).toHaveLength(6);
    expect(requests.map((request) => request.updateCells?.range?.sheetId)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(requests[0].updateCells?.range?.startRowIndex).toBe(1);
    expect(requests[1].updateCells?.range?.startRowIndex).toBe(2);
    expect(requests[1].updateCells?.range?.endRowIndex).toBe(3);
    expect(
      requests[0].updateCells?.rows?.[0]?.values?.[2]?.userEnteredValue,
    ).toEqual({ numberValue: 46195 });
    expect(
      requests[0].updateCells?.rows?.[0]?.values?.[4]?.userEnteredValue,
    ).toEqual({ stringValue: "1:30" });
    expect(
      requests[0].updateCells?.rows?.[0]?.values?.[6]?.userEnteredValue,
    ).toEqual({ stringValue: "Patricia" });
    expect(
      requests[0].updateCells?.rows?.[0]?.values?.[7]?.userEnteredValue,
    ).toEqual({ stringValue: "Zoom" });
    expect(
      requests[3].updateCells?.rows?.[0]?.values?.[4]?.userEnteredValue,
    ).toEqual({ stringValue: "Outro" });
    expect(
      requests[4].updateCells?.rows?.[0]?.values?.[2]?.userEnteredValue,
    ).toEqual({ stringValue: "Anonimo" });
    expect(
      requests[4].updateCells?.rows?.[0]?.values?.[3]?.userEnteredValue,
    ).toEqual({ stringValue: "São Paulo - SP" });
    expect(
      requests[5].updateCells?.rows?.[0]?.values?.[2]?.userEnteredValue,
    ).toEqual({ stringValue: "1M" });
    expect(
      requests[5].updateCells?.rows?.[0]?.values?.[3]?.userEnteredValue,
    ).toEqual({ numberValue: 2 });
  });

  it("calcula a primeira linha livre pela coluna de ID", () => {
    expect(firstEmptyDataRowNumber([["ata_id"], ["a"], [""], ["c"]])).toBe(3);
    expect(firstEmptyDataRowNumber([["ata_id"], ["a"], ["b"]])).toBe(4);
    expect(firstEmptyDataRowNumber([["ata_id"]])).toBe(2);
    expect(firstEmptyDataRowNumber([["ata_id"], ["a"], [undefined, false]])).toBe(3);
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
      buildAtomicWriteRequests(registro, sheetIds, nextRows),
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
        buildAtomicWriteRequests(registro, sheetIds, nextRows),
      ),
    ).rejects.toThrow("Falha simulada");
    expect(batchUpdate).toHaveBeenCalledTimes(1);
  });
});
