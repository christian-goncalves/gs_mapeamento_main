import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_HEADERS } from "./contract";
import {
  deactivateGrupoServidorMesa,
  findFirstWritableGroupRow,
  groupAdminRowsToObjects,
  saveGrupoServidorMesa,
} from "./group-admin";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  append: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({
  getSpreadsheetId: () => "spreadsheet-test",
  getSheetsClient: () => ({
    spreadsheets: {
      values: {
        get: mocks.get,
        update: mocks.update,
        append: mocks.append,
      },
    },
  }),
}));

const groupId = "11111111-1111-4111-8111-111111111111";
const serverId = "22222222-2222-4222-8222-222222222222";
const createdAt = "2026-08-01T12:00:00.000Z";

function mockAdminSheets(encargo = "RSG") {
  mocks.get.mockImplementation(({ range }: { range: string }) => {
    if (range.startsWith("grupo_servidores_mesa!")) {
      return Promise.resolve({
        data: {
          values: [
            [...SHEET_HEADERS.grupo_servidores_mesa],
            [
              serverId,
              groupId,
              encargo,
              "Carlos",
              "2026-08-03",
              true,
              1,
              createdAt,
              createdAt,
            ],
          ],
        },
      });
    }
    const sheet = range.split("!")[0] as "grupos" | "grupo_horarios";
    return Promise.resolve({ data: { values: [[...SHEET_HEADERS[sheet]]] } });
  });
}

describe("administração de grupos no Sheets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aceita grupos legados sem as três novas colunas finais", () => {
    const legacyHeaders = SHEET_HEADERS.grupos.slice(0, -3);

    expect(
      groupAdminRowsToObjects("grupos", [
        [...legacyHeaders],
        legacyHeaders.map((header) => header === "grupo_nome" ? "Bom dia" : ""),
      ]),
    ).toEqual([
      expect.objectContaining({
        rowNumber: 2,
        value: expect.objectContaining({
          grupo_nome: "Bom dia",
          fuso_horario: "",
          plataforma: "",
          acesso_plataforma: "",
        }),
      }),
    ]);
  });

  it("mantém estritas as demais diferenças de cabeçalho", () => {
    expect(() =>
      groupAdminRowsToObjects("grupo_horarios", [["horario_id"]]),
    ).toThrow("Cabeçalho inválido");
  });

  it("encontra a primeira linha sem identificadores reais, ignorando checkbox falso", () => {
    const rows = [
      ["grupo_id", "zoom_id", "grupo_nome", "ordem", "ativo"],
      ["id-1", "111", "Bom dia", 1, true],
      ["id-2", "222", "Coragem", 2, true],
      ["", "", "", "", false],
      ["", "", "", "", false],
    ];

    expect(findFirstWritableGroupRow(rows)).toBe(4);
  });

  it("usa a próxima linha quando não há linha vazia real", () => {
    const rows = [
      ["grupo_id", "zoom_id", "grupo_nome", "ordem", "ativo"],
      ["id-1", "111", "Bom dia", 1, true],
    ];

    expect(findFirstWritableGroupRow(rows)).toBe(3);
  });

  it("atualiza somente o servidor informado", async () => {
    mockAdminSheets();

    await saveGrupoServidorMesa(
      groupId,
      {
        grupo_servidor_mesa_id: serverId,
        encargo: "RSG",
        nome: "Carla",
        data_inicio: "2026-08-04",
        ativo: true,
        ordem: 1,
      },
      {
        now: () => "2026-08-03T18:00:00.000Z",
        uuid: () => "33333333-3333-4333-8333-333333333333",
      },
    );

    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        range: "grupo_servidores_mesa!A2:I2",
        requestBody: {
          values: [[
            serverId,
            groupId,
            "RSG",
            "Carla",
            "2026-08-04",
            true,
            1,
            createdAt,
            "2026-08-03T18:00:00.000Z",
          ]],
        },
      }),
    );
    expect(mocks.append).not.toHaveBeenCalled();
  });

  it("impede remover um encargo padrão", async () => {
    mockAdminSheets();

    await expect(
      deactivateGrupoServidorMesa(groupId, serverId),
    ).rejects.toThrow("Os encargos padrão não podem ser removidos.");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("desativa somente o encargo adicional informado", async () => {
    mockAdminSheets("Coordenador");

    await deactivateGrupoServidorMesa(
      groupId,
      serverId,
      {
        now: () => "2026-08-03T19:00:00.000Z",
        uuid: () => "33333333-3333-4333-8333-333333333333",
      },
    );

    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        range: "grupo_servidores_mesa!A2:I2",
        requestBody: {
          values: [[
            serverId,
            groupId,
            "Coordenador",
            "Carlos",
            "2026-08-03",
            false,
            1,
            createdAt,
            "2026-08-03T19:00:00.000Z",
          ]],
        },
      }),
    );
    expect(mocks.append).not.toHaveBeenCalled();
  });
});
