import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvalidAtaIdentifiersError } from "@/domain/ata-identifiers";
import type { AtaSubmission } from "@/domain/form-schemas";
import { SHEET_HEADERS, type SheetName } from "./contract";

const mocks = vi.hoisted(() => ({
  batchGet: vi.fn(),
  get: vi.fn(),
  batchUpdate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({
  getSpreadsheetId: () => "spreadsheet-test",
  getSheetsClient: () => ({
    spreadsheets: {
      values: { batchGet: mocks.batchGet },
      get: mocks.get,
      batchUpdate: mocks.batchUpdate,
    },
  }),
}));

import { createAtaInSheets } from "./create-ata";

const groupId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
const audit = {
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};
const submission = {
  ata: {
    grupo_id: groupId,
    data_reuniao: "2026-07-19",
    hora_inicio: "10:00",
    duracao: "",
    formato_outros: "",
    preenchido_por: "Coordenador",
    plataforma: "zoom",
    tipo_reuniao: "fechada",
    formatos: ["partilha"],
    total_membros_presentes: 1,
    total_partilhas: 1,
  },
  servidores: [],
  participacao: [],
  visitantes: [],
  ingressos: [],
  trocas_chaveiro: [],
} satisfies AtaSubmission;

function row(sheet: SheetName, data: Record<string, string | number | boolean>) {
  return SHEET_HEADERS[sheet].map((header) => data[header] ?? "");
}

function values(overrides: Partial<Record<SheetName, unknown[][]>> = {}) {
  return (Object.keys(SHEET_HEADERS) as SheetName[]).map((name) => ({
    values: overrides[name] ?? [[...SHEET_HEADERS[name]]],
  }));
}

describe("criação de ata no Sheets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue({
      data: {
        sheets: (Object.keys(SHEET_HEADERS) as SheetName[]).map((name, index) => ({
          properties: { title: name, sheetId: index + 1 },
        })),
      },
    });
    mocks.batchUpdate.mockResolvedValue({});
  });

  it("aborta quando uma ata existente tem identificadores inválidos", async () => {
    mocks.batchGet.mockResolvedValue({
      data: {
        valueRanges: values({
          grupos: [
            [...SHEET_HEADERS.grupos],
            row("grupos", {
              grupo_id: groupId,
              zoom_id: "123",
              grupo_nome: "Grupo",
              ordem: 1,
              ativo: true,
              link_formulario_ata: "token",
              ultima_reuniao_anterior: 0,
              ...audit,
            }),
          ],
          atas: [
            [...SHEET_HEADERS.atas],
            row("atas", {
              ata_id: "93ef9660-8c64-4b51-9bc5-09069ce629c1",
              grupo_id: groupId,
              data_reuniao: "2026-07-18",
              hora_inicio: "10:00",
              preenchido_por: "Coordenador",
              plataforma: "Zoom",
              tipo_reuniao: "Fechada",
              formato_partilha: true,
              total_membros_presentes: 1,
              total_partilhas: 1,
              ...audit,
            }),
          ],
        }),
      },
    });

    await expect(createAtaInSheets(submission)).rejects.toThrow(
      InvalidAtaIdentifiersError,
    );
    expect(mocks.batchUpdate).not.toHaveBeenCalled();
  });
});
