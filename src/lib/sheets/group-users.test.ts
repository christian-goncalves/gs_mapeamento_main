import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  append: vi.fn(),
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
        update: mocks.update,
        append: mocks.append,
      },
    },
  }),
  getSpreadsheetId: () => "spreadsheet-id",
}));
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
  getPendingActivationByToken,
  isActivationInviteExpired,
  rotatePendingActivationForGroup,
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
    mocks.update.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("substitui convite expirado por novo token com validade de 14 dias", async () => {
    mocks.parseRows.mockReturnValue([
      { valid: true, rowNumber: 4, data: pendingUser },
    ]);

    const rotated = await rotatePendingActivationForGroup(pendingUser.grupo_id);

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
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ range: "usuarios_grupo!A4:K4" }),
    );
    const updateValues = mocks.update.mock.calls[0]?.[0].requestBody.values[0];
    expect(updateValues[6]).not.toBe(pendingUser.convite_token);
    expect(updateValues[7]).toBe("2026-09-04T12:00:00.000Z");
  });

  it("não rotaciona usuário ativo", async () => {
    mocks.parseRows.mockReturnValue([
      { valid: true, rowNumber: 4, data: activeUser },
    ]);

    await expect(
      rotatePendingActivationForGroup(activeUser.grupo_id),
    ).resolves.toBeNull();
    expect(mocks.update).not.toHaveBeenCalled();
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
