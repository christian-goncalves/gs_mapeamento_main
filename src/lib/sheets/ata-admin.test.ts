import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_HEADERS } from "./contract";

const mocks = vi.hoisted(() => ({
  valuesGet: vi.fn(),
  spreadsheetGet: vi.fn(),
  batchUpdate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({
  getSpreadsheetId: () => "spreadsheet-test",
  getSheetsClient: () => ({
    spreadsheets: {
      values: { get: mocks.valuesGet },
      get: mocks.spreadsheetGet,
      batchUpdate: mocks.batchUpdate,
    },
  }),
}));

import { updateAtaCustomGroupIndex } from "./ata-admin";

const groupId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
const ataId = "93ef9660-8c64-4b51-9bc5-09069ce629c1";
const audit = {
  created_at: "2026-07-19T12:00:00.000Z",
  updated_at: "2026-07-19T12:00:00.000Z",
};

function row(data: Record<string, string | number | boolean>) {
  return SHEET_HEADERS.atas.map((header) => data[header] ?? "");
}

describe("edição administrativa de ata no Sheets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.valuesGet.mockResolvedValue({
      data: {
        values: [
          [...SHEET_HEADERS.atas],
          row({
            ata_id: ataId,
            numero_sequencial_grupo: 4,
            indice_personalizado_grupo: 7,
            grupo_id: groupId,
            data_reuniao: "2026-07-19",
            hora_inicio: "10:00",
            duracao: "",
            preenchido_por: "Coordenador",
            plataforma: "Zoom",
            tipo_reuniao: "Fechada",
            formato_partilha: true,
            formato_estudo: false,
            formato_tematico: false,
            formato_literatura: false,
            formato_passos: false,
            formato_tradicoes: false,
            total_membros_presentes: 1,
            total_partilhas: 1,
            ...audit,
          }),
        ],
      },
    });
    mocks.spreadsheetGet.mockResolvedValue({
      data: { sheets: [{ properties: { title: "atas", sheetId: 99 } }] },
    });
  });

  it("preserva ata_id e numero_sequencial_grupo ao editar índice", async () => {
    await updateAtaCustomGroupIndex(
      ataId,
      9,
      { now: () => "2026-07-20T12:00:00.000Z" },
    );
    expect(mocks.batchUpdate).toHaveBeenCalledOnce();
    const request = mocks.batchUpdate.mock.calls[0][0];
    const row = request.requestBody.requests[0].updateCells.rows[0].values;
    expect(row[SHEET_HEADERS.atas.indexOf("ata_id")].userEnteredValue.stringValue).toBe(ataId);
    expect(row[SHEET_HEADERS.atas.indexOf("numero_sequencial_grupo")].userEnteredValue.numberValue).toBe(4);
    expect(row[SHEET_HEADERS.atas.indexOf("indice_personalizado_grupo")].userEnteredValue.numberValue).toBe(9);
    expect(row[SHEET_HEADERS.atas.indexOf("updated_at")].userEnteredValue.stringValue).toBe("2026-07-20T12:00:00.000Z");
    expect(request.spreadsheetId).toBe("spreadsheet-test");
  });
});
