import { beforeEach, describe, expect, it, vi } from "vitest";
import { DuplicateAtaCustomIndexError } from "@/domain/ata-identifiers";

const mocks = vi.hoisted(() => ({
  requireAuthorizedSession: vi.fn(),
  readAggregatedAtas: vi.fn(),
  updateAtaCustomGroupIndex: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth/require-session", () => ({
  requireAuthorizedSession: mocks.requireAuthorizedSession,
}));
vi.mock("@/lib/sheets/repository", () => ({
  readAggregatedAtas: mocks.readAggregatedAtas,
}));
vi.mock("@/lib/sheets/ata-admin", () => ({
  updateAtaCustomGroupIndex: mocks.updateAtaCustomGroupIndex,
}));

import { updateAtaIndexAction } from "./actions";

const groupId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
const otherGroupId = "2bed9d1b-7fea-4cf4-9497-f0ccbcead41c";
const ataId = "93ef9660-8c64-4b51-9bc5-09069ce629c1";
const audit = {
  created_at: "2026-07-19T12:00:00.000Z",
  updated_at: "2026-07-19T12:00:00.000Z",
};
const group = {
  grupo_id: groupId,
  zoom_id: "123",
  grupo_nome: "Grupo",
  ordem: 1,
  ativo: true,
  responsavel_grupo_nome: "",
  responsavel_grupo_email: "",
  email_acesso_grupo: "",
  responsaveis_ata: "",
  link_formulario_ata: "token",
  ultima_reuniao_anterior: 0,
  ...audit,
};
const ata = {
  ata_id: ataId,
  numero_sequencial_grupo: 4,
  indice_personalizado_grupo: 7,
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
  ...audit,
};

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  data.set("ata_id", ataId);
  data.set("indice_personalizado_grupo", "8");
  for (const [key, value] of Object.entries(overrides)) data.set(key, value);
  return data;
}

describe("updateAtaIndexAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthorizedSession.mockResolvedValue({
      access: { role: "administrador", email: "admin@example.com", groups: [] },
    });
    mocks.readAggregatedAtas.mockResolvedValue({
      atas: [{ grupo: group, registro: { ata } }],
    });
    mocks.updateAtaCustomGroupIndex.mockResolvedValue({
      ...ata,
      indice_personalizado_grupo: 8,
    });
  });

  it("permite administrador editar índice de qualquer ata", async () => {
    await expect(updateAtaIndexAction(null, form())).resolves.toEqual({
      success: "Índice personalizado atualizado.",
    });
    expect(mocks.updateAtaCustomGroupIndex).toHaveBeenCalledWith(ataId, 8);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/atas/${ataId}`);
  });

  it("permite responsável editar ata do próprio grupo", async () => {
    mocks.requireAuthorizedSession.mockResolvedValue({
      access: {
        role: "responsavel_grupo",
        email: "resp@example.com",
        groups: [group],
      },
    });

    await expect(updateAtaIndexAction(null, form())).resolves.toEqual({
      success: "Índice personalizado atualizado.",
    });
    expect(mocks.updateAtaCustomGroupIndex).toHaveBeenCalledWith(ataId, 8);
  });

  it("bloqueia responsável de outro grupo", async () => {
    mocks.requireAuthorizedSession.mockResolvedValue({
      access: {
        role: "responsavel_grupo",
        email: "resp@example.com",
        groups: [{ ...group, grupo_id: otherGroupId }],
      },
    });

    await expect(updateAtaIndexAction(null, form())).resolves.toEqual({
      error: "Ata não encontrada ou sem permissão de edição.",
    });
    expect(mocks.updateAtaCustomGroupIndex).not.toHaveBeenCalled();
  });

  it("não permite acesso público ou não autenticado", async () => {
    mocks.requireAuthorizedSession.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(updateAtaIndexAction(null, form())).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.updateAtaCustomGroupIndex).not.toHaveBeenCalled();
  });

  it("retorna erro claro para índice duplicado", async () => {
    mocks.updateAtaCustomGroupIndex.mockRejectedValue(
      new DuplicateAtaCustomIndexError(),
    );

    await expect(updateAtaIndexAction(null, form())).resolves.toEqual({
      error: "Já existe uma ata deste grupo com este índice personalizado. Escolha outro número.",
    });
  });

  it("ignora campos imutáveis enviados no formulário", async () => {
    await updateAtaIndexAction(
      null,
      form({
        numero_sequencial_grupo: "999",
        ata_id_novo: "dbca5f07-744f-4e9f-9169-f7f66d4cbbcc",
      }),
    );

    expect(mocks.updateAtaCustomGroupIndex).toHaveBeenCalledTimes(1);
    expect(mocks.updateAtaCustomGroupIndex).toHaveBeenCalledWith(ataId, 8);
  });
});
