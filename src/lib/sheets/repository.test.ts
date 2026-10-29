import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_HEADERS, type SheetName } from "./contract";
import { compatibleHeaders, V2_NEW_SHEET_HEADERS } from "./contract-v2";

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
  listRecentServerNamesByGroup,
  listVisitantes,
  readAggregatedAtas,
} from "./repository";

function sheetNameFromRange(range: string): string {
  const [name] = range.split("!");
  return name as SheetName;
}

function headerValueRanges(ranges: string[]) {
  return ranges.map((range) => ({
    values: [[...(sheetNameFromRange(range) === "grupo_plataformas"
      ? V2_NEW_SHEET_HEADERS.grupo_plataformas
      : sheetNameFromRange(range) === "grupo_funcoes_servidor"
        ? V2_NEW_SHEET_HEADERS.grupo_funcoes_servidor
        : SHEET_HEADERS[sheetNameFromRange(range) as SheetName])]],
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
              return { values: [[...(name === "grupo_plataformas"
                ? V2_NEW_SHEET_HEADERS.grupo_plataformas
                : name === "grupo_funcoes_servidor"
                  ? V2_NEW_SHEET_HEADERS.grupo_funcoes_servidor
                  : SHEET_HEADERS[name])]] };
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

  it("retorna os últimos servidores das reuniões do grupo, sem servidores de mesa", async () => {
    const grupoId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
    const ataMaisRecente = "93ef9660-8c64-4b51-9bc5-09069ce629c1";
    const ataAnterior = "2bed9d1b-7fea-4cf4-9497-f0ccbcead41c";
    const headers = (name: SheetName) => name === "atas" ? compatibleHeaders("atas") : SHEET_HEADERS[name];
    const row = (name: SheetName, values: Record<string, string | number | boolean>) =>
      headers(name).map((header) => values[header] ?? "");
    mocks.get.mockImplementation(({ range }: { range: string }) => {
      if (range.startsWith("atas!")) {
        return Promise.resolve({ data: { values: [
          [...headers("atas")],
          row("atas", {
            ata_id: ataMaisRecente, numero_sequencial_grupo: 2, indice_personalizado_grupo: 2,
            grupo_id: grupoId, data_reuniao: "2026-08-03", hora_inicio: "20:30", duracao: "",
            formato_outros: "", preenchido_por: "Patricia", plataforma: "Zoom", tipo_reuniao: "Fechada",
            formato_partilha: true, formato_estudo: false, formato_tematico: false, formato_literatura: false,
            formato_passos: false, formato_tradicoes: false, formato_comemorativa: false, formato_servico: false,
            total_membros_presentes: 1, total_partilhas: 1, created_at: "2026-08-03T22:00:00.000Z", updated_at: "2026-08-03T22:00:00.000Z",
          }),
          row("atas", {
            ata_id: ataAnterior, numero_sequencial_grupo: 1, indice_personalizado_grupo: 1,
            grupo_id: grupoId, data_reuniao: "2026-08-02", hora_inicio: "20:30", duracao: "",
            formato_outros: "", preenchido_por: "Patricia", plataforma: "Zoom", tipo_reuniao: "Fechada",
            formato_partilha: true, formato_estudo: false, formato_tematico: false, formato_literatura: false,
            formato_passos: false, formato_tradicoes: false, formato_comemorativa: false, formato_servico: false,
            total_membros_presentes: 1, total_partilhas: 1, created_at: "2026-08-02T22:00:00.000Z", updated_at: "2026-08-02T22:00:00.000Z",
          }),
        ] } });
      }
      return Promise.resolve({ data: { values: [
        [...SHEET_HEADERS.servidores],
        ["a4e54dd9-8e3f-4d56-a932-00ea5c13fc88", ataMaisRecente, "Zeta", "", 1, "2026-08-03T22:00:00.000Z", "2026-08-03T22:00:00.000Z"],
        ["e7918765-a98d-46bf-86f8-e6deef3190a2", ataMaisRecente, "ALFA", "", 2, "2026-08-03T22:00:00.000Z", "2026-08-03T22:00:00.000Z"],
        ["dbca5f07-744f-4e9f-9169-f7f66d4cbbcc", ataAnterior, "zeta", "", 1, "2026-08-02T22:00:00.000Z", "2026-08-02T22:00:00.000Z"],
      ] } });
    });

    await expect(listRecentServerNamesByGroup(grupoId)).resolves.toEqual(["ALFA", "Zeta"]);
  });
});
