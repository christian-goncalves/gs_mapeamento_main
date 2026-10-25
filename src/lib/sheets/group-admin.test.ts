import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_HEADERS } from "./contract";
import { V2_NEW_SHEET_HEADERS } from "./contract-v2";
import {
  deactivateGrupoServidorMesa,
  findFirstWritableGroupRow,
  groupAdminRowsToObjects,
  saveGrupoServidorMesa,
  saveGrupoPlataforma,
  deactivateGrupoPlataforma,
  setGrupoHorarioPlataformas,
} from "./group-admin";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  metadata: vi.fn(),
  directWrite: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({
  getSpreadsheetId: () => "spreadsheet-test",
  getSheetsClient: () => ({
    spreadsheets: {
      values: {
        get: mocks.get,
      },
      get: mocks.metadata,
    },
  }),
}));
vi.mock("./write", async () => {
  const actual = await vi.importActual<typeof import("./write")>("./write");
  return { ...actual, executeSheetsBatch: mocks.directWrite };
});

const groupId = "11111111-1111-4111-8111-111111111111";
const serverId = "22222222-2222-4222-8222-222222222222";
const createdAt = "2026-08-01T12:00:00.000Z";
const platformId = "33333333-3333-4333-8333-333333333333";
const otherPlatformId = "44444444-4444-4444-8444-444444444444";
const horarioId = "55555555-5555-4555-8555-555555555555";

function mockPlatformSheets({ linked = true } = {}) {
  const platform = (id: string, type: string) => [id, groupId, type, `https://${type}.example.org`, "", "", true, createdAt, createdAt];
  const groupValues = SHEET_HEADERS.grupos.map((header) => ({
    grupo_id: groupId, zoom_id: "001", grupo_nome: "Grupo", ordem: 1, ativo: true,
    responsavel_grupo_nome: "", responsavel_grupo_email: "", email_acesso_grupo: "",
    responsaveis_ata: "", link_formulario_ata: "grupo", ultima_reuniao_anterior: 0,
    created_at: createdAt, updated_at: createdAt, fuso_horario: "America/Sao_Paulo",
    plataforma: "Zoom", acesso_plataforma: "001",
  }[header] ?? ""));
  const scheduleHeaders = [...SHEET_HEADERS.grupo_horarios, "plataforma_id"];
  const schedule = [horarioId, groupId, "segunda", "20:00", "", true, createdAt, createdAt, linked ? platformId : ""];
  mocks.get.mockImplementation(({ range }: { range: string }) => {
    if (range.startsWith("grupo_plataformas!")) return Promise.resolve({ data: { values: [[...V2_NEW_SHEET_HEADERS.grupo_plataformas], platform(platformId, "zoom"), platform(otherPlatformId, "whatsapp")] } });
    if (range.startsWith("grupo_horarios!")) return Promise.resolve({ data: { values: [scheduleHeaders, schedule] } });
    if (range.startsWith("grupos!")) return Promise.resolve({ data: { values: [[...SHEET_HEADERS.grupos], groupValues] } });
    return Promise.resolve({ data: { values: [[...SHEET_HEADERS.grupo_servidores_mesa]] } });
  });
  mocks.metadata.mockResolvedValue({ data: { sheets: [
    { properties: { title: "grupo_plataformas", sheetId: 21 } },
    { properties: { title: "grupo_horarios", sheetId: 22 } },
    { properties: { title: "grupos", sheetId: 23 } },
  ] } });
}

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
    mocks.metadata.mockResolvedValue({
      data: { sheets: [{ properties: { title: "grupo_servidores_mesa", sheetId: 13 } }] },
    });
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

  it("edita dados da plataforma sem tocar nos horários associados", async () => {
    mockPlatformSheets();
    await saveGrupoPlataforma({ plataforma_id: platformId, grupo_id: groupId, tipo: "zoom", link: "https://novo.example.org", id_acesso: "123", senha_pin: "456", ativo: true }, { now: () => "2026-08-03T18:00:00.000Z", uuid: () => otherPlatformId }, { kind: "authenticated", email: "admin@example.com" });
    expect(mocks.directWrite).toHaveBeenCalledTimes(1);
    const request = mocks.directWrite.mock.calls[0][0][0];
    expect(request.updateCells.range.sheetId).toBe(21);
  });

  it("transfere todos os horários antes de desativar a plataforma na mesma gravação", async () => {
    mockPlatformSheets();
    await deactivateGrupoPlataforma(groupId, platformId, otherPlatformId, { now: () => "2026-08-03T18:00:00.000Z", uuid: () => otherPlatformId }, { kind: "authenticated", email: "admin@example.com" });
    expect(mocks.directWrite).toHaveBeenCalledTimes(1);
    const requests = mocks.directWrite.mock.calls[0][0];
    expect(requests).toHaveLength(2);
    expect(requests.map((request: { updateCells?: { range?: { sheetId?: number } } }) => request.updateCells?.range?.sheetId)).toEqual([22, 21]);
  });

  it("transfere explicitamente um horário para outra plataforma ativa do mesmo grupo", async () => {
    mockPlatformSheets();
    await setGrupoHorarioPlataformas(groupId, [{ horario_id: horarioId, plataforma_id: otherPlatformId }], { now: () => "2026-08-03T18:00:00.000Z", uuid: () => otherPlatformId }, { kind: "authenticated", email: "admin@example.com" });
    expect(mocks.directWrite).toHaveBeenCalledTimes(1);
    expect(mocks.directWrite.mock.calls[0][0][0].updateCells.range.sheetId).toBe(22);
  });

  it("recusa uma segunda plataforma ativa do mesmo tipo antes de gravar", async () => {
    mockPlatformSheets();
    await expect(saveGrupoPlataforma({ grupo_id: groupId, tipo: "zoom", link: "https://duplicada.example.org", id_acesso: "", senha_pin: "", ativo: true }, undefined, { kind: "authenticated", email: "admin@example.com" })).rejects.toThrow("Já existe uma plataforma ativa deste tipo");
    expect(mocks.directWrite).not.toHaveBeenCalled();
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
      { kind: "authenticated", email: "admin@example.com" },
    );

    expect(mocks.directWrite).toHaveBeenCalledTimes(1);
    const requests = mocks.directWrite.mock.calls[0][0];
    expect(requests).toEqual([expect.objectContaining({ updateCells: expect.objectContaining({
        range: expect.objectContaining({ sheetId: 13, startRowIndex: 1, endRowIndex: 2 }),
      }) })]);
    const savedValues = requests[0]
      .updateCells.rows[0].values.map((cell: { userEnteredValue: Record<string, unknown> }) =>
        Object.values(cell.userEnteredValue)[0],
      );
    expect(savedValues).toEqual([
      serverId,
      groupId,
      "RSG",
      "Carla",
      "2026-08-04",
      true,
      1,
      createdAt,
      "2026-08-03T18:00:00.000Z",
    ]);
    expect(mocks.get).not.toHaveBeenCalledWith(expect.objectContaining({ update: expect.anything() }));
  });

  it("permite remover um encargo cadastrado", async () => {
    mockAdminSheets();

    await expect(
      deactivateGrupoServidorMesa(groupId, serverId, undefined, { kind: "authenticated", email: "admin@example.com" }),
    ).resolves.toMatchObject({ ativo: false });
    expect(mocks.directWrite).toHaveBeenCalledOnce();
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
      { kind: "authenticated", email: "admin@example.com" },
    );

    expect(mocks.directWrite).toHaveBeenCalledTimes(1);
    const savedValues = mocks.directWrite.mock.calls[0][0][0]
      .updateCells.rows[0].values.map((cell: { userEnteredValue: Record<string, unknown> }) =>
        Object.values(cell.userEnteredValue)[0],
      );
    expect(savedValues).toEqual([
      serverId,
      groupId,
      "Coordenador",
      "Carlos",
      "2026-08-03",
      false,
      1,
      createdAt,
      "2026-08-03T19:00:00.000Z",
    ]);
  });
});
