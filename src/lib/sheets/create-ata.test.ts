import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvalidAtaIdentifiersError } from "@/domain/ata-identifiers";
import type { AtaSubmission } from "@/domain/form-schemas";
import { SHEET_HEADERS, type SheetName } from "./contract";
import { compatibleHeaders, V2_NEW_SHEET_HEADERS } from "./contract-v2";

const mocks = vi.hoisted(() => ({
  batchGet: vi.fn(),
  valuesGet: vi.fn(),
  get: vi.fn(),
  batchUpdate: vi.fn(),
  updateAtaNameSuggestionsFromSubmission: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ata-name-suggestions.server", () => ({
  updateAtaNameSuggestionsFromSubmission: mocks.updateAtaNameSuggestionsFromSubmission,
}));
vi.mock("./client", () => ({
  getSpreadsheetId: () => "spreadsheet-test",
  getSheetsClient: () => ({
    spreadsheets: {
      values: { batchGet: mocks.batchGet, get: mocks.valuesGet },
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
    values: overrides[name] ?? [[...(name === "atas" ? compatibleHeaders(name) : SHEET_HEADERS[name])]],
  }));
}

describe("criação de ata no Sheets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue({
      data: {
        sheets: [
          ...(Object.keys(SHEET_HEADERS) as SheetName[]).map((name, index) => ({
          properties: {
            title: name,
            sheetId: index + 1,
            gridProperties: { rowCount: 1000, columnCount: compatibleHeaders(name).length },
          },
          })),
          {
            properties: {
              title: "grupo_funcoes_servidor",
              sheetId: 99,
              gridProperties: { rowCount: 1000, columnCount: V2_NEW_SHEET_HEADERS.grupo_funcoes_servidor.length },
            },
          },
        ],
      },
    });
    mocks.updateAtaNameSuggestionsFromSubmission.mockResolvedValue({});
    mocks.valuesGet.mockImplementation(({ range }: { range: string }) => Promise.resolve({
      data: {
        values: range.startsWith("grupo_funcoes_servidor!")
          ? [[...V2_NEW_SHEET_HEADERS.grupo_funcoes_servidor]]
          : [[...V2_NEW_SHEET_HEADERS.grupo_plataformas], ["22222222-2222-4222-8222-222222222222", groupId, "zoom", "https://zoom.example.org", "secret-access-id", "secret-pin", true, audit.created_at, audit.updated_at]],
      },
    }));
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

    await expect(createAtaInSheets(submission, "responsavel@example.com")).rejects.toThrow(
      InvalidAtaIdentifiersError,
    );
    expect(mocks.batchUpdate).not.toHaveBeenCalled();
    expect(mocks.updateAtaNameSuggestionsFromSubmission).not.toHaveBeenCalled();
  });

  it("atualiza sugestões de nomes após gravar a ata", async () => {
    const legacyVisitantesHeaders = [...SHEET_HEADERS.visitantes];
    legacyVisitantesHeaders[
      SHEET_HEADERS.visitantes.indexOf("como_chegou_a_na")
    ] = "como_chegou_a_na?";
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
          visitantes: [legacyVisitantesHeaders],
        }),
      },
    });

    await createAtaInSheets({
      ...submission,
      servidores: [{ nome: "Hércules", funcao: "Coordenador" }],
    }, "  RESPONSAVEL@example.com  ");

    expect(mocks.batchUpdate).toHaveBeenCalledOnce();
    expect(mocks.batchUpdate.mock.calls[0][0].spreadsheetId).toBe("spreadsheet-test");
    expect(mocks.batchUpdate.mock.calls[0][0].requestBody.requests).toHaveLength(2);
    expect(mocks.updateAtaNameSuggestionsFromSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        ata: expect.objectContaining({ preenchido_por: "Coordenador" }),
        servidores: [{ nome: "Hércules", funcao: "Coordenador" }],
      }),
    );
  });

  it("grava uma função personalizada no mesmo lote da ata", async () => {
    mocks.batchGet.mockResolvedValue({
      data: {
        valueRanges: values({
          grupos: [
            [...SHEET_HEADERS.grupos],
            row("grupos", {
              grupo_id: groupId,
              grupo_nome: "Grupo",
              ordem: 1,
              ativo: true,
              ultima_reuniao_anterior: 0,
              ...audit,
            }),
          ],
        }),
      },
    });

    await createAtaInSheets({
      ...submission,
      servidores: [{ nome: "Hércules", funcao: "  apoio   técnico " }],
    }, "responsavel@example.com");

    const requests = mocks.batchUpdate.mock.calls[0][0].requestBody.requests;
    const functionRequest = requests.find((request: { updateCells?: { range?: { sheetId?: number } } }) => request.updateCells?.range?.sheetId === 99);
    expect(functionRequest.updateCells.range.startRowIndex).toBe(1);
    expect(functionRequest.updateCells.rows[0].values.map((cell: { userEnteredValue?: { stringValue?: string; boolValue?: boolean } }) => cell.userEnteredValue?.stringValue ?? cell.userEnteredValue?.boolValue)).toEqual([
      expect.any(String),
      groupId,
      "Apoio técnico",
      "apoio técnico",
      true,
      expect.any(String),
      expect.any(String),
    ]);
  });

  it("resolve a plataforma pela associação do horário recorrente, ignorando a plataforma legada do grupo", async () => {
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
              fuso_horario: "America/Sao_Paulo",
              plataforma: "Zello",
              acesso_plataforma: "canal-zello",
              ...audit,
            }),
          ],
          grupo_horarios: [
            [...SHEET_HEADERS.grupo_horarios, "plataforma_id"],
            [...row("grupo_horarios", { horario_id: "33333333-3333-4333-8333-333333333333", grupo_id: groupId, dia_semana: "domingo", hora_inicio: "10:00", ativo: true, ...audit }), "22222222-2222-4222-8222-222222222222"],
          ],
        }),
      },
    });

    await createAtaInSheets({
      ...submission,
      ata: { ...submission.ata, plataforma: "whatsapp" },
    }, undefined, "public-link-token");

    expect(mocks.updateAtaNameSuggestionsFromSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ ata: expect.objectContaining({ plataforma: "zoom" }) }),
    );
    const ataValues = mocks.batchUpdate.mock.calls[0][0].requestBody.requests[0].updateCells.rows[0].values;
    expect(ataValues[compatibleHeaders("atas").indexOf("plataforma")].userEnteredValue)
      .toEqual({ stringValue: "Zoom" });
    expect(JSON.stringify(ataValues)).not.toContain("22222222-2222-4222-8222-222222222222");
    expect(JSON.stringify(ataValues)).not.toContain("secret-");
  });

  it("não chama batchUpdate quando uma recorrência está sem plataforma ativa", async () => {
    mocks.batchGet.mockResolvedValue({
      data: { valueRanges: values({
        grupos: [
          [...SHEET_HEADERS.grupos],
          row("grupos", { grupo_id: groupId, zoom_id: "123", grupo_nome: "Grupo", ordem: 1, ativo: true, link_formulario_ata: "token", ultima_reuniao_anterior: 0, fuso_horario: "America/Sao_Paulo", ...audit }),
        ],
        grupo_horarios: [
          [...SHEET_HEADERS.grupo_horarios, "plataforma_id"],
          [...row("grupo_horarios", { horario_id: "33333333-3333-4333-8333-333333333333", grupo_id: groupId, dia_semana: "domingo", hora_inicio: "10:00", ativo: true, ...audit }), ""],
        ],
      }) },
    });

    await expect(createAtaInSheets(submission, "responsavel@example.com"))
      .rejects.toThrow("Este horário recorrente ainda não tem uma plataforma configurada");
    expect(mocks.batchUpdate).not.toHaveBeenCalled();
  });

  it("não chama batchUpdate quando há horários recorrentes duplicados", async () => {
    const schedules = ["33333333-3333-4333-8333-333333333333", "44444444-4444-4444-8444-444444444444"];
    mocks.batchGet.mockResolvedValue({
      data: { valueRanges: values({
        grupos: [
          [...SHEET_HEADERS.grupos],
          row("grupos", { grupo_id: groupId, zoom_id: "123", grupo_nome: "Grupo", ordem: 1, ativo: true, link_formulario_ata: "token", ultima_reuniao_anterior: 0, fuso_horario: "America/Sao_Paulo", ...audit }),
        ],
        grupo_horarios: [
          [...SHEET_HEADERS.grupo_horarios, "plataforma_id"],
          ...schedules.map((horario_id) => [...row("grupo_horarios", { horario_id, grupo_id: groupId, dia_semana: "domingo", hora_inicio: "10:00", ativo: true, ...audit }), "22222222-2222-4222-8222-222222222222"]),
        ],
      }) },
    });

    await expect(createAtaInSheets(submission, "responsavel@example.com"))
      .rejects.toThrow("horários duplicados");
    expect(mocks.batchUpdate).not.toHaveBeenCalled();
  });

  it("não chama batchUpdate quando uma reunião extra escolhe plataforma inativa ou de outro grupo", async () => {
    mocks.batchGet.mockResolvedValue({ data: { valueRanges: values({
      grupos: [
        [...SHEET_HEADERS.grupos],
        row("grupos", { grupo_id: groupId, zoom_id: "123", grupo_nome: "Grupo", ordem: 1, ativo: true, link_formulario_ata: "token", ultima_reuniao_anterior: 0, ...audit }),
      ],
    }) } });
    mocks.valuesGet.mockResolvedValue({ data: { values: [
      [...V2_NEW_SHEET_HEADERS.grupo_plataformas],
      ["22222222-2222-4222-8222-222222222222", "99999999-9999-4999-8999-999999999999", "zoom", "https://zoom.example.org", "", "", true, audit.created_at, audit.updated_at],
    ] } });

    await expect(createAtaInSheets(submission, "responsavel@example.com"))
      .rejects.toThrow("Selecione uma plataforma ativa do grupo");
    expect(mocks.batchUpdate).not.toHaveBeenCalled();
  });

  it("lê a configuração do grupo e grava o novo envio como pendente", async () => {
    const groupHeaders = [...compatibleHeaders("grupos")];
    const groupData: Record<string, string | number | boolean> = {
      grupo_id: groupId,
      zoom_id: "123",
      grupo_nome: "Grupo",
      ordem: 1,
      ativo: true,
      link_formulario_ata: "token",
      ultima_reuniao_anterior: 0,
      ...audit,
    };
    mocks.batchGet.mockResolvedValue({
      data: {
        valueRanges: values({
          grupos: [
            groupHeaders,
            groupHeaders.map((header) => header === "revisao_atas_ativa" ? true : groupData[header] ?? ""),
          ],
        }),
      },
    });

    const result = await createAtaInSheets(submission, "responsavel@example.com");
    const requests = mocks.batchUpdate.mock.calls[0][0].requestBody.requests;
    const ataValues = requests[0].updateCells.rows[0].values;

    expect(result.statusAprovacao).toBe("pendente_revisao");
    expect(ataValues[compatibleHeaders("atas").indexOf("status_aprovacao")].userEnteredValue)
      .toEqual({ stringValue: "pendente_revisao" });
    expect(ataValues[compatibleHeaders("atas").indexOf("aprovado_por")].userEnteredValue)
      .toEqual({ stringValue: "" });
  });
});
