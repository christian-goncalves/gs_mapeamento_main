import { beforeEach, describe, expect, it, vi } from "vitest";
import { DuplicateAtaError } from "@/domain/creation";

const mocks = vi.hoisted(() => ({
  createAtaInSheets: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  requireAuthorizedSession: vi.fn(),
  getActiveGroupByAtaLink: vi.fn(),
}));

vi.mock("@/lib/sheets/create-ata", () => ({
  createAtaInSheets: mocks.createAtaInSheets,
}));
vi.mock("@/lib/auth/require-session", () => ({
  requireAuthorizedSession: mocks.requireAuthorizedSession,
}));
vi.mock("@/lib/sheets/repository", () => ({
  getActiveGroupByAtaLink: mocks.getActiveGroupByAtaLink,
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { createAtaAction } from "./actions";

const payload = JSON.stringify({
  ata: {
    grupo_id: "fccced1d-92a5-4d24-b5af-da65cbbe467f",
    data_reuniao: "2026-06-22",
    hora_inicio: "20:30",
    duracao: "",
    formato_outros: "",
    preenchido_por: "Patricia",
    plataforma: "zoom",
    tipo_reuniao: "aberta",
    formatos: ["partilha"],
    total_membros_presentes: 1,
    total_partilhas: 1,
  },
  servidores: [],
  participacao: [],
  visitantes: [],
  ingressos: [],
  trocas_chaveiro: [],
});

const hiddenPayload = JSON.stringify({
  ata: {
    grupo_id: "fccced1d-92a5-4d24-b5af-da65cbbe467f",
    data_reuniao: "2026-06-22",
    hora_inicio: "20:30",
    duracao: "1:30",
    formato_outros: "",
    preenchido_por: "Patricia",
    plataforma: "zoom",
    tipo_reuniao: "aberta",
    formatos: ["partilha"],
    total_membros_presentes: 20,
    total_partilhas: 3,
  },
  servidores: [],
  participacao: [{ localidade: "Itajaí - SC", presencas: 8 }],
  visitantes: [{ nome: "", cidade: "Itajaí - SC" }],
  ingressos: [{ nome: "", cidade: "Brusque - SC" }],
  trocas_chaveiro: [{ tempo_limpo: "1M", quantidade: 1 }],
});

function formData(confirmed: boolean) {
  const data = new FormData();
  data.set("confirmed", String(confirmed));
  data.set("payload", payload);
  return data;
}

function hiddenFormData() {
  const data = new FormData();
  data.set("confirmed", "true");
  data.set("payload", hiddenPayload);
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

  it("normaliza payload hidden antes de chamar o adaptador", async () => {
    mocks.createAtaInSheets.mockResolvedValue(
      "93ef9660-8c64-4b51-9bc5-09069ce629c1",
    );
    await createAtaAction({}, hiddenFormData());
    expect(mocks.createAtaInSheets).toHaveBeenCalledWith(
      expect.objectContaining({
        participacao: [
          expect.objectContaining({
            localidade: "Itajaí",
            estado: "SC",
            pais: "Brasil",
          }),
        ],
        visitantes: [
          expect.objectContaining({
            nome: "Anonimo",
            categoria: "outro",
            origem_contato: "outro",
          }),
        ],
        ingressos: [expect.objectContaining({ nome: "Anonimo", cidade: "Brusque - SC" })],
      }),
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
