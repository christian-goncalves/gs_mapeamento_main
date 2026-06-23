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

import { readAggregatedAtas } from "./repository";

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
});
