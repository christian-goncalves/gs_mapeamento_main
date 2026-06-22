import { beforeEach, describe, expect, it, vi } from "vitest";
import { DuplicateAtaError } from "@/domain/creation";

const mocks = vi.hoisted(() => ({
  createAtaInSheets: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  requireAuthorizedSession: vi.fn(),
}));

vi.mock("@/lib/sheets/create-ata", () => ({
  createAtaInSheets: mocks.createAtaInSheets,
}));
vi.mock("@/lib/auth/require-session", () => ({
  requireAuthorizedSession: mocks.requireAuthorizedSession,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { createAtaAction } from "./actions";

const payload = JSON.stringify({
  ata: {
    grupo_id: "fccced1d-92a5-4d24-b5af-da65cbbe467f",
    data_reuniao: "2026-06-22",
    hora_inicio: "20:30",
    plataforma: "zoom",
    tipo_reuniao: "aberta",
    formatos: ["partilha"],
    total_membros_presentes: 0,
  },
  servidores: [],
  participacao: [],
  visitantes: [],
  trocas_chaveiro: [],
});

function formData(confirmed: boolean) {
  const data = new FormData();
  data.set("confirmed", String(confirmed));
  data.set("payload", payload);
  return data;
}

describe("Server Action de criação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthorizedSession.mockResolvedValue({ user: { email: "allowed@example.com" } });
  });

  it("revalida autorização antes de qualquer envio", async () => {
    await createAtaAction({}, formData(false));
    expect(mocks.requireAuthorizedSession).toHaveBeenCalledOnce();
    expect(mocks.createAtaInSheets).not.toHaveBeenCalled();
  });

  it("cancelamento ou envio sem confirmação não escreve", async () => {
    await expect(createAtaAction({}, formData(false))).resolves.toEqual({
      error: "Confirme o resumo antes de enviar.",
    });
    expect(mocks.createAtaInSheets).not.toHaveBeenCalled();
  });

  it("redireciona somente depois da confirmação do adaptador", async () => {
    mocks.createAtaInSheets.mockResolvedValue(
      "93ef9660-8c64-4b51-9bc5-09069ce629c1",
    );
    await createAtaAction({}, formData(true));
    expect(mocks.createAtaInSheets).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/atas/93ef9660-8c64-4b51-9bc5-09069ce629c1",
    );
  });

  it("retorna erro localizado quando a chave já existe", async () => {
    mocks.createAtaInSheets.mockRejectedValue(new DuplicateAtaError());
    await expect(createAtaAction({}, formData(true))).resolves.toEqual({
      error: "Já existe uma ata para este grupo, data e horário.",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
