import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Grupo, GrupoHorario } from "@/domain/entities";

const mocks = vi.hoisted(() => ({
  readAggregatedAtas: vi.fn(),
  requireAdminSession: vi.fn(),
  requireAuthorizedSession: vi.fn(),
  deleteGrupoHorarios: vi.fn(),
  deactivateGrupoServidorMesa: vi.fn(),
  saveGrupo: vi.fn(),
  saveGrupoHorario: vi.fn(),
  saveGrupoServidorMesa: vi.fn(),
  saveGrupoServidoresMesa: vi.fn(),
  rotatePendingActivationForGroup: vi.fn(),
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
  deactivateGrupoServidorMesa: mocks.deactivateGrupoServidorMesa,
  deleteGrupoHorarios: mocks.deleteGrupoHorarios,
  saveGrupo: mocks.saveGrupo,
  saveGrupoHorario: mocks.saveGrupoHorario,
  saveGrupoServidorMesa: mocks.saveGrupoServidorMesa,
  saveGrupoServidoresMesa: mocks.saveGrupoServidoresMesa,
}));
vi.mock("@/lib/sheets/group-users", () => ({
  rotatePendingActivationForGroup: mocks.rotatePendingActivationForGroup,
  syncResponsibleGroupUser: mocks.syncResponsibleGroupUser,
}));
vi.mock("@/lib/email/activation-email", () => ({
  sendActivationEmail: mocks.sendActivationEmail,
}));

import {
  activateGrupoAction,
  deactivateGrupoServidorMesaAction,
  deactivateGrupoAction,
  duplicateGrupoAction,
  rotateAtaLinkAction,
  rotateActivationInviteAction,
  saveGrupoAction,
  saveGrupoServidorMesaAction,
  saveGrupoServidoresMesaAction,
  saveHorariosGrupoAction,
} from "./actions";

const ataLinkTokenPattern = /^[a-f0-9]{64}$/;

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
  fuso_horario: "America/Sao_Paulo",
  plataforma: "zoom",
  acesso_plataforma: "12345678",
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
  fuso_horario: "America/Sao_Paulo",
  plataforma: "zoom",
  acesso_plataforma: "87654321",
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

const inactiveGroup: Grupo = {
  ...groupTwo,
  grupo_id: "55555555-5555-4555-8555-555555555555",
  grupo_nome: "Grupo Inativo",
  ativo: false,
  link_formulario_ata: "grupo-inativo",
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
  data.set("acesso_plataforma", group.acesso_plataforma);
  data.set("plataforma", group.plataforma);
  data.set("fuso_horario", group.fuso_horario);
  data.set("grupo_nome", group.grupo_nome);
  if (group.ativo) data.set("ativo", "on");
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
      grupo_servidores_mesa: [],
      atas: [],
      servidores: [],
      participacao: [],
      visitantes: [],
      ingressos: [],
      trocas_chaveiro: [],
      invalidRows: [],
    });
    mocks.saveGrupo.mockImplementation(async (group: Grupo) => group);
    mocks.sendActivationEmail.mockResolvedValue(undefined);
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

  it("permite identificador de plataforma repetido entre grupos", async () => {
    await saveGrupoAction(null, groupForm({ acesso_plataforma: groupOne.acesso_plataforma }));

    expect(mocks.saveGrupo).toHaveBeenCalledWith(
      expect.objectContaining({
        grupo_id: groupTwo.grupo_id,
        zoom_id: groupTwo.zoom_id,
        acesso_plataforma: groupOne.acesso_plataforma,
        email_acesso_grupo: groupTwo.email_acesso_grupo,
        link_formulario_ata: expect.stringMatching(ataLinkTokenPattern),
      }),
    );
    expect(mocks.saveGrupo.mock.calls[0]?.[0].link_formulario_ata).not.toBe(
      groupTwo.link_formulario_ata,
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/admin/grupos/${groupTwo.grupo_id}?status=saved`,
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

  });

  it("continua salvamento do grupo com sucesso mesmo se envio de e-mail falhar", async () => {
    mocks.syncResponsibleGroupUser.mockResolvedValue({
      status: "pendente",
      convite_token: "token-novo",
      inviteCreated: true,
    });
    mocks.sendActivationEmail.mockRejectedValue(new Error("API de e-mail indisponível"));

    await saveGrupoAction(
      null,
      groupForm({ email_acesso_grupo: "novo-login@example.com" }),
    );

    expect(mocks.sendActivationEmail).toHaveBeenCalledOnce();
    expect(mocks.saveGrupo).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/admin/grupos/${groupTwo.grupo_id}?status=saved`,
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
      `/admin/grupos/${groupTwo.grupo_id}?status=saved`,
    );
  });

  it("rotaciona o convite pendente e reenvia o e-mail", async () => {
    const user = {
      usuario_id: "66666666-6666-4666-8666-666666666666",
      grupo_id: groupTwo.grupo_id,
      email: groupTwo.email_acesso_grupo,
      nome: groupTwo.responsavel_grupo_nome,
      senha_hash: "",
      status: "pendente" as const,
      convite_token: "token-novo",
      convite_expira_em: "2026-09-04T00:00:00.000Z",
      ultimo_login: "",
      created_at: "2026-08-05T00:00:00.000Z",
      updated_at: "2026-08-21T00:00:00.000Z",
    };
    mocks.rotatePendingActivationForGroup.mockResolvedValue(user);
    const data = groupIdForm(groupTwo.grupo_id);

    await rotateActivationInviteAction(data);

    expect(mocks.requireAdminSession).toHaveBeenCalledOnce();
    expect(mocks.rotatePendingActivationForGroup).toHaveBeenCalledWith(
      groupTwo.grupo_id,
    );
    expect(mocks.sendActivationEmail).toHaveBeenCalledWith({
      group: groupTwo,
      user,
    });
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/admin/grupos/${groupTwo.grupo_id}?status=activation-invite-rotated`,
    );
  });

  it("preserva o novo convite quando o reenvio do e-mail falha", async () => {
    const user = {
      usuario_id: "66666666-6666-4666-8666-666666666666",
      grupo_id: groupTwo.grupo_id,
      email: groupTwo.email_acesso_grupo,
      nome: "",
      senha_hash: "",
      status: "pendente" as const,
      convite_token: "token-novo",
      convite_expira_em: "2026-09-04T00:00:00.000Z",
      ultimo_login: "",
      created_at: "2026-08-05T00:00:00.000Z",
      updated_at: "2026-08-21T00:00:00.000Z",
    };
    mocks.rotatePendingActivationForGroup.mockResolvedValue(user);
    mocks.sendActivationEmail.mockRejectedValueOnce(new Error("Resend indisponível"));

    await rotateActivationInviteAction(groupIdForm(groupTwo.grupo_id));

    expect(mocks.redirect).toHaveBeenCalledWith(
      `/admin/grupos/${groupTwo.grupo_id}?status=activation-invite-rotated-email-failed`,
    );
  });

  it("gera token seguro para link de ata ao criar grupo", async () => {
    const data = groupForm({
      grupo_id: "",
      grupo_nome: "Grupo Novo",
      email_acesso_grupo: "novo@example.com",
    });
    data.delete("grupo_id");

    await saveGrupoAction(null, data);

    const savedGroup = mocks.saveGrupo.mock.calls[0]?.[0] as Grupo;
    expect(savedGroup).toEqual(
      expect.objectContaining({
        grupo_nome: "Grupo Novo",
        responsavel_grupo_nome: "",
        responsavel_grupo_email: "",
        email_acesso_grupo: "novo@example.com",
      }),
    );
    expect(mocks.syncResponsibleGroupUser).toHaveBeenCalledWith(savedGroup);
    expect(savedGroup.link_formulario_ata).toMatch(ataLinkTokenPattern);
    expect(savedGroup.link_formulario_ata).not.toBe("grupo-novo");
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/admin/grupos/${savedGroup.grupo_id}?status=created`,
    );
  });

  it("preserva metadados legados do responsável quando não vêm do formulário", async () => {
    await saveGrupoAction(null, groupForm());

    expect(mocks.saveGrupo).toHaveBeenCalledWith(
      expect.objectContaining({
        grupo_id: groupTwo.grupo_id,
        responsavel_grupo_nome: groupTwo.responsavel_grupo_nome,
        responsavel_grupo_email: groupTwo.responsavel_grupo_email,
        email_acesso_grupo: groupTwo.email_acesso_grupo,
      }),
    );
  });

  it("salva servidores da mesa com nomes vazios como vago", async () => {
    const data = groupForm();
    data.set(
      "servidores_mesa",
      JSON.stringify([
        {
          encargo: "RSG",
          nome: "",
          data_inicio: "",
          ativo: true,
          ordem: 1,
        },
        {
          encargo: "RSG suplente",
          nome: "   ",
          data_inicio: "",
          ativo: true,
          ordem: 2,
        },
      ]),
    );

    await saveGrupoAction(null, data);

    expect(mocks.saveGrupoServidoresMesa).toHaveBeenCalledWith(groupTwo.grupo_id, [
      expect.objectContaining({
        grupo_id: groupTwo.grupo_id,
        encargo: "RSG",
        nome: "vago",
        data_inicio: "",
      }),
      expect.objectContaining({
        grupo_id: groupTwo.grupo_id,
        encargo: "RSG suplente",
        nome: "vago",
        data_inicio: "",
      }),
    ]);
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/admin/grupos/${groupTwo.grupo_id}?status=saved-mesa-missing-names`,
    );
  });

  it("salva servidores da mesa vago sem data de inicio", async () => {
    const data = groupForm();
    data.set(
      "servidores_mesa",
      JSON.stringify([
        {
          encargo: "Tesoureiro",
          nome: "vago",
          data_inicio: "",
          ativo: true,
          ordem: 1,
        },
      ]),
    );

    await saveGrupoAction(null, data);

    expect(mocks.saveGrupoServidoresMesa).toHaveBeenCalledWith(groupTwo.grupo_id, [
      expect.objectContaining({
        grupo_id: groupTwo.grupo_id,
        encargo: "Tesoureiro",
        nome: "vago",
        data_inicio: "",
      }),
    ]);
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/admin/grupos/${groupTwo.grupo_id}?status=saved-mesa-missing-names`,
    );
  });

  it("salva somente os servidores da mesa pela ação independente", async () => {
    const data = groupIdForm();
    data.set(
      "servidores_mesa",
      JSON.stringify([
        {
          encargo: "RSG",
          nome: "Carlos",
          data_inicio: "2026-08-03",
          ativo: true,
          ordem: 1,
        },
      ]),
    );

    await saveGrupoServidoresMesaAction(null, data);

    expect(mocks.saveGrupo).not.toHaveBeenCalled();
    expect(mocks.saveGrupoServidoresMesa).toHaveBeenCalledWith(
      groupTwo.grupo_id,
      [expect.objectContaining({ encargo: "RSG", nome: "Carlos" })],
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/admin/grupos/${groupTwo.grupo_id}?status=saved`,
    );
  });

  it("salva somente o servidor da mesa selecionado", async () => {
    const data = groupIdForm();
    data.set("grupo_servidor_mesa_id", "77777777-7777-4777-8777-777777777777");
    data.set("encargo", "RSG");
    data.set("nome", "Carlos");
    data.set("data_inicio", "2026-08-03");
    data.set("ordem", "1");

    await saveGrupoServidorMesaAction(null, data);

    expect(mocks.saveGrupoServidoresMesa).not.toHaveBeenCalled();
    expect(mocks.saveGrupoServidorMesa).toHaveBeenCalledWith(
      groupTwo.grupo_id,
      expect.objectContaining({
        grupo_servidor_mesa_id: "77777777-7777-4777-8777-777777777777",
        encargo: "RSG",
        nome: "Carlos",
        data_inicio: "2026-08-03",
      }),
    );
  });

  it("salva servidor individual vago sem data de início", async () => {
    const data = groupIdForm();
    data.set("grupo_servidor_mesa_id", "77777777-7777-4777-8777-777777777777");
    data.set("encargo", "RSG");
    data.set("nome", "Vago");
    data.set("data_inicio", "");
    data.set("ordem", "1");

    await saveGrupoServidorMesaAction(null, data);

    expect(mocks.saveGrupoServidorMesa).toHaveBeenCalledWith(
      groupTwo.grupo_id,
      expect.objectContaining({ nome: "Vago", data_inicio: "" }),
    );
  });

  it("recusa servidor individual preenchido sem data de início", async () => {
    const data = groupIdForm();
    data.set("encargo", "RSG");
    data.set("nome", "Carlos");
    data.set("data_inicio", "");
    data.set("ordem", "1");

    await expect(saveGrupoServidorMesaAction(null, data)).resolves.toEqual({
      error: "Informe a data de início para encargos preenchidos.",
    });
    expect(mocks.saveGrupoServidorMesa).not.toHaveBeenCalled();
  });

  it("remove somente um encargo adicional", async () => {
    const data = groupIdForm();
    data.set("grupo_servidor_mesa_id", "77777777-7777-4777-8777-777777777777");

    await deactivateGrupoServidorMesaAction(data);

    expect(mocks.deactivateGrupoServidorMesa).toHaveBeenCalledWith(
      groupTwo.grupo_id,
      "77777777-7777-4777-8777-777777777777",
    );
    expect(mocks.saveGrupoServidoresMesa).not.toHaveBeenCalled();
  });

  it("não usa o e-mail do responsável como fallback do login", async () => {
    const data = groupForm({ grupo_id: "" });
    data.delete("grupo_id");
    data.delete("email_acesso_grupo");
    data.set("responsavel_grupo_email", "responsavel@example.com");

    await expect(saveGrupoAction(null, data)).resolves.toEqual({
      error: "Campo obrigatório.",
    });
    expect(mocks.saveGrupo).not.toHaveBeenCalled();
  });

  it("marca grupo e horarios ativos como inativos ao inativar", async () => {
    await deactivateGrupoAction(groupIdForm());

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
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/grupos");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/admin/grupos/${groupTwo.grupo_id}`);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/meu-grupo");
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/grupos?status=deactivated");
  });

  it("ativa grupo inativo sem reativar horarios automaticamente", async () => {
    mocks.readAggregatedAtas.mockResolvedValueOnce({
      grupos: [groupOne, groupTwo, inactiveGroup],
      grupo_horarios: [groupTwoSchedule],
      grupo_servidores_mesa: [],
      atas: [],
      servidores: [],
      participacao: [],
      visitantes: [],
      ingressos: [],
      trocas_chaveiro: [],
      invalidRows: [],
    });

    await activateGrupoAction(groupIdForm(inactiveGroup.grupo_id));

    expect(mocks.saveGrupo).toHaveBeenCalledWith(
      expect.objectContaining({
        grupo_id: inactiveGroup.grupo_id,
        ativo: true,
      }),
    );
    expect(mocks.saveGrupoHorario).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/grupos");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/admin/grupos/${inactiveGroup.grupo_id}`);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/meu-grupo");
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/grupos?status=activated");
  });

  it("nao altera grupo ja ativo ao ativar novamente", async () => {
    await activateGrupoAction(groupIdForm(groupTwo.grupo_id));

    expect(mocks.saveGrupo).not.toHaveBeenCalled();
    expect(mocks.saveGrupoHorario).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/grupos?status=already-active");
  });

  it("falha com erro controlado ao ativar grupo inexistente", async () => {
    await expect(
      activateGrupoAction(groupIdForm("99999999-9999-4999-8999-999999999999")),
    ).rejects.toThrow("Grupo não encontrado.");

    expect(mocks.saveGrupo).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
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
    expect(duplicatedGroup.link_formulario_ata).toMatch(ataLinkTokenPattern);
    expect(duplicatedGroup.link_formulario_ata).not.toBe(groupTwo.link_formulario_ata);
    expect(mocks.saveGrupoHorario).toHaveBeenCalledWith(
      expect.objectContaining({
        grupo_id: duplicatedGroup.grupo_id,
        dia_semana: groupTwoSchedule.dia_semana,
        hora_inicio: groupTwoSchedule.hora_inicio,
        ativo: true,
      }),
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/admin/grupos/${duplicatedGroup.grupo_id}?status=created`,
    );
  });

  it("rotaciona o token do link de ata e invalida o valor anterior", async () => {
    await rotateAtaLinkAction(groupIdForm());

    const savedGroup = mocks.saveGrupo.mock.calls[0]?.[0] as Grupo;
    expect(savedGroup).toEqual(
      expect.objectContaining({
        grupo_id: groupTwo.grupo_id,
        grupo_nome: groupTwo.grupo_nome,
      }),
    );
    expect(savedGroup.link_formulario_ata).toMatch(ataLinkTokenPattern);
    expect(savedGroup.link_formulario_ata).not.toBe(groupTwo.link_formulario_ata);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/admin/grupos/${groupTwo.grupo_id}`);
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/grupos/${groupTwo.grupo_id}`);
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/admin/grupos/${groupTwo.grupo_id}?status=ata-link-rotated`,
    );
  });

  it("remove permanentemente horarios excluidos na edicao em lista", async () => {
    mocks.readAggregatedAtas.mockResolvedValueOnce({
      grupos: [groupOne, groupTwo],
      grupo_horarios: [groupTwoSchedule, groupTwoSecondSchedule],
      grupo_servidores_mesa: [],
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
    expect(mocks.redirect).toHaveBeenCalledWith(`/admin/grupos/${groupTwo.grupo_id}`);
  });
});
