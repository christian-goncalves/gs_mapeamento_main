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

function headerValueRanges(ranges: string[]) {
  return ranges.map((range) => ({
    values: [[...SHEET_HEADERS[sheetNameFromRange(range)]]],
  }));
}

function sheetRow(
  name: SheetName,
  values: Record<string, string | number | boolean>,
) {
  return SHEET_HEADERS[name].map((header) => values[header] ?? "");
}

describe("repositório Sheets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isola aba ausente como diagnóstico em vez de derrubar a listagem", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.batchGet.mockImplementation(
      ({ ranges }: { ranges: string[] }) => {
        if (ranges.some((range) => range.startsWith("ingressos!"))) {
          return Promise.reject(
            new Error(`Unable to parse range: ${ranges.find((range) => range.startsWith("ingressos!"))}`),
          );
        }
        return Promise.resolve({
          data: { valueRanges: headerValueRanges(ranges) },
        });
      }
    );

    const result = await readAggregatedAtas();

    expect(result.atas).toEqual([]);
    expect(result.diagnostics).toContainEqual({
      sheet: "ingressos",
      rowNumber: 1,
      field: "aba",
      message: "Aba ausente no Sheets. Reconciliar o contrato antes de usar este dado.",
    });
    expect(mocks.batchGet).toHaveBeenCalledTimes(2);
    expect(
      mocks.batchGet.mock.calls[1][0].ranges.some((range: string) =>
        range.startsWith("ingressos!"),
      ),
    ).toBe(false);
    expect(mocks.get).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith(
      "[sheets.readContractSheets]",
      JSON.stringify({ kind: "missing_sheet", sheet: "ingressos" }),
    );
    warning.mockRestore();
  });

  it("aceita grupo_servidores_mesa vazia", async () => {
    mocks.batchGet.mockImplementation(
      ({ ranges }: { ranges: string[] }) =>
        Promise.resolve({ data: { valueRanges: headerValueRanges(ranges) } }),
    );

    const result = await readAggregatedAtas();

    expect(result.grupo_servidores_mesa).toEqual([]);
    expect(mocks.batchGet).toHaveBeenCalledTimes(1);
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("lê registros de grupo_servidores_mesa", async () => {
    const grupoId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
    const audit = {
      created_at: "2026-08-03T12:00:00.000Z",
      updated_at: "2026-08-03T12:00:00.000Z",
    };
    mocks.batchGet.mockImplementation(
      ({ ranges }: { ranges: string[] }) =>
        Promise.resolve({
          data: {
            valueRanges: ranges.map((range) => {
              const name = sheetNameFromRange(range);
              if (name === "grupos") {
                return {
                  values: [
                    [...SHEET_HEADERS.grupos],
                    sheetRow("grupos", {
                      grupo_id: grupoId,
                      zoom_id: "001",
                      grupo_nome: "Grupo",
                      ordem: 1,
                      ativo: true,
                      fuso_horario: "America/Sao_Paulo",
                      plataforma: "Zoom",
                      ...audit,
                    }),
                  ],
                };
              }
              if (name === "grupo_servidores_mesa") {
                return {
                  values: [
                    [...SHEET_HEADERS.grupo_servidores_mesa],
                    sheetRow("grupo_servidores_mesa", {
                      grupo_servidor_mesa_id:
                        "24c2b4e5-7ef0-4cfa-8c84-d9d626b3a8db",
                      grupo_id: grupoId,
                      encargo: "RSG",
                      nome: "vago",
                      ativo: true,
                      ordem: 1,
                      ...audit,
                    }),
                  ],
                };
              }
              return { values: [[...SHEET_HEADERS[name]]] };
            }),
          },
        }),
    );

    const result = await readAggregatedAtas();

    expect(result.grupo_servidores_mesa).toEqual([
      expect.objectContaining({
        grupo_id: grupoId,
        encargo: "RSG",
        nome: "vago",
      }),
    ]);
  });

  it.each([
    [401, "authentication"],
    [429, "quota"],
  ])("classifica falha %i no log como %s", async (status, kind) => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = Object.assign(new Error("Falha da API"), {
      response: { status },
    });
    mocks.batchGet.mockRejectedValue(error);

    await expect(readAggregatedAtas()).rejects.toBe(error);
    expect(logged).toHaveBeenCalledWith(
      "[sheets.readContractSheets]",
      JSON.stringify({ kind, status, message: "Falha da API" }),
    );
    logged.mockRestore();
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
