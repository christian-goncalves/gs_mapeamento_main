import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  metadata: vi.fn(),
  directWrite: vi.fn(),
  parseRows: vi.fn(),
  rowsToObjects: vi.fn(),
  domainUsuarioGrupoToSheet: vi.fn((value) => value),
  sheetUsuarioGrupoToDomain: vi.fn((value) => value),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));
vi.mock("./client", () => ({
  getSheetsClient: () => ({
    spreadsheets: {
      values: {
        get: mocks.get,
      },
      get: mocks.metadata,
    },
  }),
  getSpreadsheetId: () => "spreadsheet-id",
}));
vi.mock("./contract-v2", () => ({
  rowsToCompatibleObjects: () => [],
  sheetReadRange: () => "usuarios_grupo!A:K",
}));
vi.mock("./write", async () => {
  const actual = await vi.importActual<typeof import("./write")>("./write");
  return { ...actual, executeSheetsBatch: mocks.directWrite };
});
vi.mock("./rows", () => ({
  parseRows: mocks.parseRows,
  rowsToObjects: mocks.rowsToObjects,
}));
vi.mock("./schemas", () => ({
  domainUsuarioGrupoToSheet: mocks.domainUsuarioGrupoToSheet,
  sheetUsuarioGrupoSchema: {},
  sheetUsuarioGrupoToDomain: mocks.sheetUsuarioGrupoToDomain,
}));

import {
  activateGroupUser,
  createPasswordResetForGroupUser,
  getPendingActivationByToken,
  getPasswordResetByToken,
  isActivationInviteExpired,
  resetGroupUserPassword,
  rotatePendingActivationForGroup,
  syncResponsibleGroupUser,
  validateGroupCredentials,
} from "./group-users";

const pendingUser = {
  usuario_id: "66666666-6666-4666-8666-666666666666",
  grupo_id: "22222222-2222-4222-8222-222222222222",
  email: "grupo@example.com",
  nome: "",
  senha_hash: "",
  status: "pendente" as const,
  convite_token: "token-antigo",
  convite_expira_em: "2026-08-19T00:00:00.000Z",
  ultimo_login: "",
  created_at: "2026-08-05T00:00:00.000Z",
  updated_at: "2026-08-05T00:00:00.000Z",
};

const activeUser = {
  ...pendingUser,
  status: "ativo" as const,
  senha_hash: "hash-existente",
  convite_token: "",
  convite_expira_em: "",
};

describe("convites de acesso de usuários de grupo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-21T12:00:00.000Z"));
    vi.clearAllMocks();
    mocks.rowsToObjects.mockReturnValue([]);
    mocks.get.mockResolvedValue({ data: { values: [] } });
    mocks.metadata.mockResolvedValue({
      data: { sheets: [{ properties: { title: "usuarios_grupo", sheetId: 17 } }] },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("substitui convite expirado por novo token com validade de 14 dias", async () => {
    mocks.parseRows.mockReturnValue([
      { valid: true, rowNumber: 4, data: pendingUser },
    ]);

    const rotated = await rotatePendingActivationForGroup(pendingUser.grupo_id, "admin@example.com");

    expect(rotated).toEqual(
      expect.objectContaining({
        usuario_id: pendingUser.usuario_id,
        grupo_id: pendingUser.grupo_id,
        status: "pendente",
        senha_hash: "",
        convite_expira_em: "2026-09-04T12:00:00.000Z",
      }),
    );
    expect(rotated?.convite_token).toEqual(expect.any(String));
    expect(rotated?.convite_token).not.toBe(pendingUser.convite_token);
    expect(mocks.directWrite).toHaveBeenCalledOnce();
    const request = mocks.directWrite.mock.calls[0]?.[0][0].updateCells;
    expect(request.range).toEqual(expect.objectContaining({
      sheetId: 17,
      startRowIndex: 3,
      endRowIndex: 4,
    }));
    const updateValues = request.rows[0].values.map((cell: { userEnteredValue: Record<string, unknown> }) =>
      Object.values(cell.userEnteredValue)[0],
    );
    expect(updateValues[6]).not.toBe(pendingUser.convite_token);
    expect(updateValues[7]).toBe("2026-09-04T12:00:00.000Z");
  });

  it("não rotaciona usuário ativo", async () => {
    mocks.parseRows.mockReturnValue([
      { valid: true, rowNumber: 4, data: activeUser },
    ]);

    await expect(
      rotatePendingActivationForGroup(activeUser.grupo_id, "admin@example.com"),
    ).resolves.toBeNull();
    expect(mocks.directWrite).not.toHaveBeenCalled();
  });

  it("valida o token de ativação antes da gravação direta", async () => {
    vi.setSystemTime(new Date("2026-08-10T12:00:00.000Z"));
    mocks.parseRows.mockReturnValue([
      { valid: true, rowNumber: 4, data: pendingUser },
    ]);
    const { hashPassword } = await import("@/lib/auth/password");
    vi.mocked(hashPassword).mockResolvedValue("hash-novo");

    await activateGroupUser(pendingUser.convite_token, "senha-segura");

    expect(mocks.directWrite).toHaveBeenCalledOnce();
  });

  it("sincroniza usuário de grupo por gravação direta", async () => {
    mocks.parseRows.mockReturnValue([]);
    mocks.get.mockResolvedValue({ data: { values: [[]] } });

    await syncResponsibleGroupUser({
      grupo_id: pendingUser.grupo_id,
      email_acesso_grupo: "grupo@example.com",
      responsavel_grupo_nome: "Responsável",
    } as never, "ADMIN@example.com");

    expect(mocks.directWrite).toHaveBeenCalledOnce();
  });

  it("grava último login após validar as credenciais", async () => {
    mocks.parseRows.mockReturnValue([
      { valid: true, rowNumber: 2, data: activeUser },
    ]);
    const { verifyPassword } = await import("@/lib/auth/password");
    vi.mocked(verifyPassword).mockResolvedValue(true);

    await validateGroupCredentials(activeUser.email, "senha-correta");

    expect(mocks.directWrite).toHaveBeenCalledOnce();
  });

  it("emite token de recuperação por gravação direta", async () => {
    mocks.parseRows.mockReturnValue([
      { valid: true, rowNumber: 2, data: activeUser },
    ]);

    const reset = await createPasswordResetForGroupUser(activeUser.email);

    expect(reset).toEqual(expect.objectContaining({
      usuario_id: activeUser.usuario_id,
      convite_expira_em: "2026-08-22T12:00:00.000Z",
    }));
    expect(mocks.directWrite).toHaveBeenCalledOnce();
  });

  it("redefine senha somente pelo token vigente", async () => {
    const resetUser = {
      ...activeUser,
      convite_token: "reset-token",
      convite_expira_em: "2026-08-22T12:00:00.000Z",
    };
    mocks.parseRows.mockReturnValue([
      { valid: true, rowNumber: 2, data: resetUser },
    ]);
    const { hashPassword } = await import("@/lib/auth/password");
    vi.mocked(hashPassword).mockResolvedValue("hash-novo");

    await resetGroupUserPassword("reset-token", "nova-senha");

    expect(mocks.directWrite).toHaveBeenCalledOnce();
  });

  it("recusa token de redefinição expirado antes de gravar", async () => {
    const resetUser = {
      ...activeUser,
      convite_token: "reset-token",
      convite_expira_em: "2026-08-20T12:00:00.000Z",
    };
    mocks.parseRows.mockReturnValue([
      { valid: true, rowNumber: 2, data: resetUser },
    ]);

    await expect(getPasswordResetByToken("reset-token")).resolves.toBeNull();
    expect(mocks.directWrite).not.toHaveBeenCalled();
  });

  it("continua rejeitando o token antigo depois da rotação", async () => {
    mocks.parseRows.mockReturnValue([
      {
        valid: true,
        rowNumber: 4,
        data: {
          ...pendingUser,
          convite_token: "token-novo",
          convite_expira_em: "2026-09-04T12:00:00.000Z",
        },
      },
    ]);

    await expect(getPendingActivationByToken("token-antigo")).resolves.toBeNull();
  });

  it("identifica a validade do convite pelo vencimento persistido", () => {
    expect(isActivationInviteExpired("2026-08-20T12:00:00.000Z")).toBe(true);
    expect(isActivationInviteExpired("2026-08-22T12:00:00.000Z")).toBe(false);
  });
});
