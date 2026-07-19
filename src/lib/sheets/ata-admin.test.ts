import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_HEADERS } from "./contract";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({
  getSpreadsheetId: () => "spreadsheet-test",
  getSheetsClient: () => ({
    spreadsheets: {
      values: {
        get: mocks.get,
        update: mocks.update,
      },
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
    mocks.update.mockResolvedValue({});
    mocks.get.mockResolvedValue({
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
  });

  it("preserva ata_id e numero_sequencial_grupo ao editar índice", async () => {
    await updateAtaCustomGroupIndex(ataId, 9, {
      now: () => "2026-07-20T12:00:00.000Z",
    });

    const updatedRow = mocks.update.mock.calls[0][0].requestBody.values[0];
    expect(updatedRow[SHEET_HEADERS.atas.indexOf("ata_id")]).toBe(ataId);
    expect(updatedRow[SHEET_HEADERS.atas.indexOf("numero_sequencial_grupo")]).toBe(4);
    expect(updatedRow[SHEET_HEADERS.atas.indexOf("indice_personalizado_grupo")]).toBe(9);
    expect(updatedRow[SHEET_HEADERS.atas.indexOf("updated_at")]).toBe(
      "2026-07-20T12:00:00.000Z",
    );
  });
});
