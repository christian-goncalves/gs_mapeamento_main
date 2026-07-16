import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Grupo, GrupoHorario } from "@/domain/entities";

const mocks = vi.hoisted(() => ({
  readAggregatedAtas: vi.fn(),
  requireAdminSession: vi.fn(),
  requireAuthorizedSession: vi.fn(),
  deleteGrupoHorarios: vi.fn(),
  saveGrupo: vi.fn(),
  saveGrupoHorario: vi.fn(),
  syncResponsibleGroupUser: vi.fn(),
  sendActivationEmail: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/require-session", () => ({
  requireAdminSession: mocks.requireAdminSession,
  requireAuthorizedSession: mocks.requireAuthorizedSession,
}));
vi.mock("@/lib/sheets/repository", () => ({
  readAggregatedAtas: mocks.readAggregatedAtas,
}));
vi.mock("@/lib/sheets/group-admin", () => ({
  deleteGrupoHorarios: mocks.deleteGrupoHorarios,
  saveGrupo: mocks.saveGrupo,
  saveGrupoHorario: mocks.saveGrupoHorario,
}));
vi.mock("@/lib/sheets/group-users", () => ({
  syncResponsibleGroupUser: mocks.syncResponsibleGroupUser,
}));
vi.mock("@/lib/email/activation-email", () => ({
  sendActivationEmail: mocks.sendActivationEmail,
}));

import {
  deleteGrupoAction,
  duplicateGrupoAction,
  saveGrupoAction,
  saveHorariosGrupoAction,
} from "./actions";

const groupOne: Grupo = {
  grupo_id: "11111111-1111-4111-8111-111111111111",
  zoom_id: "12345678",
  grupo_nome: "Grupo Um",
  ordem: 1,
  ativo: true,
  responsavel_grupo_nome: "Responsável Um",
  responsavel_grupo_email: "um@example.com",
  email_acesso_grupo: "login-um@example.com",
  responsaveis_ata: "",
  link_formulario_ata: "grupo-um",
  ultima_reuniao_anterior: 0,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

const groupTwo: Grupo = {
  grupo_id: "22222222-2222-4222-8222-222222222222",
  zoom_id: "87654321",
  grupo_nome: "Grupo Dois",
  ordem: 2,
  ativo: true,
  responsavel_grupo_nome: "Responsável Dois",
  responsavel_grupo_email: "dois@example.com",
  email_acesso_grupo: "login-dois@example.com",
  responsaveis_ata: "",
  link_formulario_ata: "grupo-dois",
  ultima_reuniao_anterior: 12,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

const groupTwoSchedule: GrupoHorario = {
  horario_id: "33333333-3333-4333-8333-333333333333",
  grupo_id: groupTwo.grupo_id,
  dia_semana: "domingo",
  hora_inicio: "09:00",
  link_reuniao: "",
  ativo: true,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

const groupTwoSecondSchedule: GrupoHorario = {
  ...groupTwoSchedule,
  horario_id: "44444444-4444-4444-8444-444444444444",
  dia_semana: "segunda",
  hora_inicio: "09:00",
};

function groupForm(overrides: Partial<Grupo> = {}) {
  const data = new FormData();
  const group = { ...groupTwo, ...overrides };
  data.set("grupo_id", group.grupo_id);
  data.set("zoom_id", group.zoom_id);
  data.set("grupo_nome", group.grupo_nome);
  if (group.ativo) data.set("ativo", "on");
  data.set("responsavel_grupo_nome", group.responsavel_grupo_nome);
  data.set("responsavel_grupo_email", group.responsavel_grupo_email);
  data.set("email_acesso_grupo", group.email_acesso_grupo);
  data.set("ultima_reuniao_anterior", String(group.ultima_reuniao_anterior));
  return data;
}

function groupIdForm(grupoId = groupTwo.grupo_id) {
  const data = new FormData();
  data.set("grupo_id", grupoId);
  return data;
}

function horariosForm(
  horarios: Array<Pick<GrupoHorario, "dia_semana" | "hora_inicio">>,
) {
  const data = groupIdForm();
  data.set("horarios", JSON.stringify(horarios));
  return data;
}

describe("Server Action de grupos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminSession.mockResolvedValue({
      access: { role: "administrador", email: "admin@example.com", groups: [] },
    });
    mocks.requireAuthorizedSession.mockResolvedValue({
      access: { role: "administrador", email: "admin@example.com", groups: [] },
    });
    mocks.readAggregatedAtas.mockResolvedValue({
      grupos: [groupOne, groupTwo],
      grupo_horarios: [groupTwoSchedule],
      atas: [],
      servidores: [],
      participacao: [],
      visitantes: [],
      ingressos: [],
      trocas_chaveiro: [],
      invalidRows: [],
    });
    mocks.saveGrupo.mockImplementation(async (group: Grupo) => group);
    mocks.syncResponsibleGroupUser.mockResolvedValue({
      status: "ativo",
      inviteCreated: false,
    });
  });

  it("retorna erro amigável para e-mail de login duplicado", async () => {
    await expect(
      saveGrupoAction(null, groupForm({ email_acesso_grupo: "LOGIN-UM@example.com" })),
    ).resolves.toEqual({
      error: "O e-mail de login já está vinculado a outro grupo. Por favor escolha outro e-mail.",
    });

    expect(mocks.saveGrupo).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("permite Zoom ID repetido entre grupos", async () => {
    await saveGrupoAction(null, groupForm({ zoom_id: groupOne.zoom_id }));

    expect(mocks.saveGrupo).toHaveBeenCalledWith(
      expect.objectContaining({
        grupo_id: groupTwo.grupo_id,
        zoom_id: groupOne.zoom_id,
        email_acesso_grupo: groupTwo.email_acesso_grupo,
      }),
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/grupos/${groupTwo.grupo_id}?status=saved`,
    );
  });

  it("redireciona com aviso quando a troca de e-mail gera novo convite", async () => {
    mocks.syncResponsibleGroupUser.mockResolvedValue({
      status: "pendente",
      convite_token: "token-novo",
      inviteCreated: true,
    });

    await saveGrupoAction(
      null,
      groupForm({ email_acesso_grupo: "novo-login@example.com" }),
    );

    expect(mocks.sendActivationEmail).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/grupos/${groupTwo.grupo_id}?status=activation-invite-sent`,
    );
  });

  it("nao reenvia convite quando o responsavel continua pendente com o mesmo e-mail", async () => {
    mocks.syncResponsibleGroupUser.mockResolvedValue({
      status: "pendente",
      convite_token: "token-existente",
      inviteCreated: false,
    });

    await saveGrupoAction(null, groupForm());

    expect(mocks.sendActivationEmail).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/grupos/${groupTwo.grupo_id}?status=saved`,
    );
  });

  it("marca grupo e horarios ativos como inativos ao excluir", async () => {
    await deleteGrupoAction(groupIdForm());

    expect(mocks.saveGrupo).toHaveBeenCalledWith(
      expect.objectContaining({
        grupo_id: groupTwo.grupo_id,
        ativo: false,
      }),
    );
    expect(mocks.saveGrupoHorario).toHaveBeenCalledWith(
      expect.objectContaining({
        horario_id: groupTwoSchedule.horario_id,
        ativo: false,
      }),
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/grupos");
  });

  it("duplica grupo com horarios ativos sem copiar emails de acesso", async () => {
    await duplicateGrupoAction(groupIdForm());

    const duplicatedGroup = mocks.saveGrupo.mock.calls[0]?.[0] as Grupo;
    expect(duplicatedGroup).toEqual(
      expect.objectContaining({
        zoom_id: groupTwo.zoom_id,
        grupo_nome: "Grupo Dois - Copia",
        ativo: true,
        responsavel_grupo_nome: "",
        responsavel_grupo_email: "",
        email_acesso_grupo: "",
        ultima_reuniao_anterior: groupTwo.ultima_reuniao_anterior,
      }),
    );
    expect(duplicatedGroup.grupo_id).not.toBe(groupTwo.grupo_id);
    expect(mocks.saveGrupoHorario).toHaveBeenCalledWith(
      expect.objectContaining({
        grupo_id: duplicatedGroup.grupo_id,
        dia_semana: groupTwoSchedule.dia_semana,
        hora_inicio: groupTwoSchedule.hora_inicio,
        ativo: true,
      }),
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/grupos/${duplicatedGroup.grupo_id}?status=created`,
    );
  });

  it("remove permanentemente horarios excluidos na edicao em lista", async () => {
    mocks.readAggregatedAtas.mockResolvedValueOnce({
      grupos: [groupOne, groupTwo],
      grupo_horarios: [groupTwoSchedule, groupTwoSecondSchedule],
      atas: [],
      servidores: [],
      participacao: [],
      visitantes: [],
      ingressos: [],
      trocas_chaveiro: [],
      invalidRows: [],
    });

    await saveHorariosGrupoAction(
      horariosForm([
        {
          dia_semana: groupTwoSecondSchedule.dia_semana,
          hora_inicio: groupTwoSecondSchedule.hora_inicio,
        },
      ]),
    );

    expect(mocks.deleteGrupoHorarios).toHaveBeenCalledWith([
      groupTwoSchedule.horario_id,
    ]);
    expect(mocks.saveGrupoHorario).not.toHaveBeenCalledWith(
      expect.objectContaining({
        horario_id: groupTwoSchedule.horario_id,
        ativo: false,
      }),
    );
    expect(mocks.redirect).toHaveBeenCalledWith(`/grupos/${groupTwo.grupo_id}`);
  });
});
