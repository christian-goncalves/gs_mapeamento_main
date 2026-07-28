import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_HEADERS, type SheetName } from "./contract";

const mocks = vi.hoisted(() => ({
  batchGet: vi.fn(),
  get: vi.fn(),
}));

vi.mock("./client", () => ({
  getSpreadsheetId: () => "spreadsheet-test",
  getSheetsClient: () => ({
    spreadsheets: {
      values: {
        batchGet: mocks.batchGet,
        get: mocks.get,
      },
    },
  }),
}));
vi.mock("server-only", () => ({}));

import {
  getActiveGroupByAtaLink,
  listVisitantes,
  readAggregatedAtas,
} from "./repository";

function sheetNameFromRange(range: string): SheetName {
  const [name] = range.split("!");
  return name as SheetName;
}

describe("repositório Sheets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isola aba ausente como diagnóstico em vez de derrubar a listagem", async () => {
    mocks.batchGet.mockRejectedValue(
      new Error("Unable to parse range: ingressos!A:Z"),
    );
    mocks.get.mockImplementation(({ range }: { range: string }) => {
      const name = sheetNameFromRange(range);
      if (name === "ingressos") {
        return Promise.reject(
          new Error("Unable to parse range: ingressos!A:Z"),
        );
      }
      return Promise.resolve({
        data: { values: [[...SHEET_HEADERS[name]]] },
      });
    });

    const result = await readAggregatedAtas();

    expect(result.atas).toEqual([]);
    expect(result.diagnostics).toContainEqual({
      sheet: "ingressos",
      rowNumber: 1,
      field: "aba",
      message: "Aba ausente no Sheets. Reconciliar o contrato antes de usar este dado.",
    });
  });

  it("lê visitantes com o cabeçalho atual enquanto a reconciliação não foi executada", async () => {
    const headers: string[] = [...SHEET_HEADERS.visitantes];
    headers[SHEET_HEADERS.visitantes.indexOf("como_chegou_a_na")] =
      "como_chegou_a_na?";
    mocks.get.mockResolvedValue({
      data: {
        values: [
          headers,
          [
            "a86f8bc3-e943-48e8-8853-cabbb41ab071",
            "93ef9660-8c64-4b51-9bc5-09069ce629c1",
            "visitante_1",
            "Itajaí - SC",
            "Outro",
            "Internet",
            "2026-07-25T12:00:00.000Z",
            "2026-07-25T12:00:00.000Z",
          ],
        ],
      },
    });

    const result = await listVisitantes();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      valid: true,
      data: {
        nome: "visitante_1",
        descricao: "outro",
        como_chegou_a_na: "internet",
      },
    });
  });

  it("rejeita slug previsível como credencial do link público da ata", async () => {
    await expect(getActiveGroupByAtaLink("grupo-um")).resolves.toBeNull();

    expect(mocks.batchGet).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
