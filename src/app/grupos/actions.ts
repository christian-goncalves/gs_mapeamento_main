"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  grupoFormSchema,
  grupoHorarioFormSchema,
} from "@/domain/form-schemas";
import { isVacantMesaName } from "@/domain/grupo-servidores-mesa";
import { diaSemanaOrder, diaSemanaSchema, grupoPlataformaSchema, horaInicioSchema } from "@/domain/schemas";
import { plataformaMapping } from "@/domain/enums";
import type { Grupo } from "@/domain/entities";
import { canAccessGroup } from "@/lib/auth/access";
import { sendActivationEmail } from "@/lib/email/activation-email";
import { sendNewUserNotificationEmail } from "@/lib/email/new-user-notification-email";
import {
  requireAdminSession,
  requireAuthorizedSession,
} from "@/lib/auth/require-session";
import { isSecureAtaLinkToken } from "@/lib/ata-link-token";
import { uniqueAtaLinkToken } from "@/lib/ata-link-token.server";
import {
  GroupReviewColumnMissingError,
  deactivateGrupoServidorMesa,
  saveGrupo,
  saveGrupoHorario,
  saveGrupoPlataforma,
  saveGrupoHorarioSet,
  setGrupoHorarioPlataformas,
  deactivateGrupoPlataforma,
  saveGrupoServidorMesa,
  saveGrupoServidoresMesa,
} from "@/lib/sheets/group-admin";
import {
  rotatePendingActivationForGroup,
  syncResponsibleGroupUser,
} from "@/lib/sheets/group-users";
import { readAggregatedAtas } from "@/lib/sheets/repository";
import { z } from "zod";

export type SaveGrupoState = { error?: string } | null;

const ADMIN_GROUPS_PATH = "/admin/grupos";

function adminGroupPath(grupoId: string) {
  return `${ADMIN_GROUPS_PATH}/${grupoId}`;
}

function groupDetailPath(grupoId: string, isAdmin: boolean) {
  return isAdmin ? adminGroupPath(grupoId) : `/grupos/${grupoId}`;
}

function groupReturnPath(grupoId: string, isAdmin: boolean, stayOnNewGroupPage: boolean) {
  return isAdmin && stayOnNewGroupPage
    ? `/admin/grupos/novo?grupoId=${encodeURIComponent(grupoId)}`
    : groupDetailPath(grupoId, isAdmin);
}

function returnPathKeepingSettingsSectionOpen(path: string, formData: FormData) {
  const section = text(formData, "settings_section");
  if (!(["servers", "platforms", "schedules"] as const).includes(section as never)) {
    return path;
  }
  return `${path}${path.includes("?") ? "&" : "?"}settingsSection=${section}`;
}

function revalidateGroupAdminPaths(grupoId: string) {
  revalidatePath(ADMIN_GROUPS_PATH);
  revalidatePath(adminGroupPath(grupoId));
  revalidatePath(`/grupos/${grupoId}`);
  revalidatePath("/meu-grupo");
  revalidatePath("/responsavel/atas");
}

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function bool(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function int(formData: FormData, name: string) {
  const value = text(formData, name);
  return value ? Number(value) : 0;
}

const horariosPayloadSchema = z
  .array(
    z.object({
      horario_id: z.string().uuid().optional(),
      dia_semana: diaSemanaSchema,
      hora_inicio: horaInicioSchema,
      plataforma_id: z.string().uuid().optional(),
    }),
  )
  .min(1, "Informe pelo menos um horário.");

const servidorMesaPayloadSchema =
  z
    .object({
      grupo_servidor_mesa_id: z.string().uuid().optional(),
      encargo: z.string().trim().min(1, "Campo obrigatório."),
      nome: z.string().trim(),
      data_inicio: z.string().trim().refine(
        (value) => !value || z.string().date().safeParse(value).success,
        "Data de início inválida.",
      ),
      ativo: z.boolean(),
      ordem: z.number().int().min(1),
    })
    .superRefine((item, context) => {
      if (!isVacantMesaName(item.nome) && !item.data_inicio) {
        context.addIssue({
          code: "custom",
          path: ["data_inicio"],
          message: "Informe a data de início para encargos preenchidos.",
        });
      }
    })
    .transform((item) => ({
      ...item,
      nome: item.nome.trim().replace(/\s+/g, " ") || "vago",
    }));

const servidoresMesaPayloadSchema = z.array(servidorMesaPayloadSchema);

function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

function parseServidoresMesaPayload(formData: FormData, grupoId: string) {
  const payload = text(formData, "servidores_mesa");
  if (!payload) return null;
  const parsed = servidoresMesaPayloadSchema.safeParse(JSON.parse(payload));
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Revise os servidores da mesa antes de salvar.",
    };
  }
  return {
    data: parsed.data.map((item) => ({
      ...item,
      grupo_id: grupoId,
    })),
  };
}

class DuplicateGroupLoginEmailError extends Error {
  constructor() {
    super("O e-mail de login já está vinculado a outro grupo. Por favor escolha outro e-mail.");
  }
}

function assertUniqueGroupFields(
  grupoId: string,
  emailAcessoGrupo: string,
  groups: readonly Grupo[],
) {
  const normalizedEmail = normalizeEmail(emailAcessoGrupo);
  if (
    normalizedEmail &&
    groups.some(
      (group) =>
        group.grupo_id !== grupoId &&
        normalizeEmail(group.email_acesso_grupo) === normalizedEmail,
    )
  ) {
    throw new DuplicateGroupLoginEmailError();
  }
}

export async function saveGrupoAction(
  _state: SaveGrupoState,
  formData: FormData,
): Promise<SaveGrupoState> {
  const grupoId = text(formData, "grupo_id") || randomUUID();
  const existingGroupId = text(formData, "grupo_id");
  const current = existingGroupId
    ? await requireAuthorizedSession()
    : await requireAdminSession();

  if (existingGroupId && !canAccessGroup(current.access, existingGroupId)) {
    redirect("/");
  }

  const result = await readAggregatedAtas();
  const existingGroup = existingGroupId
    ? result.grupos.find((group) => group.grupo_id === existingGroupId)
    : undefined;
  const isAdmin = current.access.role === "administrador";
  const stayOnNewGroupPage = isAdmin && (bool(formData, "return_to_new_group_page") || !existingGroupId);
  const responsavelGrupoNome =
    text(formData, "responsavel_grupo_nome") ||
    existingGroup?.responsavel_grupo_nome ||
    "";
  const responsavelGrupoEmail =
    text(formData, "responsavel_grupo_email") ||
    existingGroup?.responsavel_grupo_email ||
    "";
  const raw = {
    acesso_plataforma: text(formData, "acesso_plataforma") || existingGroup?.acesso_plataforma || "",
    plataforma: text(formData, "plataforma") || existingGroup?.plataforma || "zoom",
    fuso_horario: text(formData, "fuso_horario"),
    grupo_nome: text(formData, "grupo_nome"),
    ativo: bool(formData, "ativo"),
    plataforma_id: text(formData, "plataforma_id") || undefined,
    revisao_atas_ativa: bool(formData, "revisao_atas_ativa"),
    responsavel_grupo_nome: responsavelGrupoNome,
    responsavel_grupo_email: responsavelGrupoEmail,
    email_acesso_grupo:
      text(formData, "email_acesso_grupo") ||
      existingGroup?.email_acesso_grupo ||
      "",
    ultima_reuniao_anterior: int(formData, "ultima_reuniao_anterior"),
  };
  const parsedResult = grupoFormSchema.safeParse(raw);
  if (!parsedResult.success) {
    return {
      error: parsedResult.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  let parsedServidoresMesa:
    | ReturnType<typeof parseServidoresMesaPayload>
    | null = null;
  try {
    parsedServidoresMesa = parseServidoresMesaPayload(formData, grupoId);
  } catch {
    return { error: "Revise os servidores da mesa antes de salvar." };
  }
  if (parsedServidoresMesa && "error" in parsedServidoresMesa) {
    return { error: parsedServidoresMesa.error };
  }
  const parsed = parsedResult.data;
  const ordem =
    existingGroup?.ordem ??
    Math.max(0, ...result.grupos.map((group) => group.ordem)) + 1;
  const existingAtaLinkToken = existingGroup?.link_formulario_ata ?? "";
  const linkFormularioAta =
    isSecureAtaLinkToken(existingAtaLinkToken)
      ? existingAtaLinkToken
      : uniqueAtaLinkToken(result.grupos, grupoId);
  const groupToSave = isAdmin
    ? {
        ...parsed,
        zoom_id: existingGroup?.zoom_id ?? parsed.acesso_plataforma,
        ordem,
        responsaveis_ata: existingGroup?.responsaveis_ata ?? "",
        link_formulario_ata: linkFormularioAta,
        ultima_reuniao_anterior: parsed.ultima_reuniao_anterior,
      }
    : {
        zoom_id: existingGroup?.zoom_id ?? parsed.acesso_plataforma,
        grupo_nome: existingGroup?.grupo_nome ?? parsed.grupo_nome,
        ordem,
        ativo: existingGroup?.ativo ?? true,
        revisao_atas_ativa: parsed.revisao_atas_ativa,
        responsavel_grupo_nome: existingGroup?.responsavel_grupo_nome ?? "",
        responsavel_grupo_email: existingGroup?.responsavel_grupo_email ?? "",
        email_acesso_grupo: existingGroup?.email_acesso_grupo ?? "",
        responsaveis_ata: existingGroup?.responsaveis_ata ?? "",
        link_formulario_ata: linkFormularioAta,
        ultima_reuniao_anterior: parsed.ultima_reuniao_anterior,
        fuso_horario: parsed.fuso_horario,
        plataforma: parsed.plataforma,
        acesso_plataforma: parsed.acesso_plataforma,
      };
  try {
    assertUniqueGroupFields(
      grupoId,
      groupToSave.email_acesso_grupo,
      result.grupos,
    );
  } catch (error) {
    if (error instanceof DuplicateGroupLoginEmailError) {
      return { error: error.message };
    }
    throw error;
  }
  const previousEmail = normalizeEmail(existingGroup?.email_acesso_grupo ?? "");
  const nextEmail = normalizeEmail(groupToSave.email_acesso_grupo);
  let savedGroup: Grupo;
  try {
    savedGroup = await saveGrupo({
      grupo_id: grupoId,
      ...groupToSave,
    }, undefined, { kind: "authenticated", email: current.access.email });
  } catch (error) {
    if (error instanceof GroupReviewColumnMissingError) {
      return { error: error.message };
    }
    throw error;
  }
  if (parsedServidoresMesa?.data) {
    await saveGrupoServidoresMesa(grupoId, parsedServidoresMesa.data, undefined, { kind: "authenticated", email: current.access.email });
  }
  let activationInviteSent = false;
  if (isAdmin) {
    const user = await syncResponsibleGroupUser(savedGroup, current.access.email);
    if (user?.status === "pendente" && user.inviteCreated) {
      try {
        await sendActivationEmail({ group: savedGroup, user });
        activationInviteSent = true;
      } catch (emailError) {
        console.error("Falha ao enviar e-mail de ativação para o grupo:", savedGroup.grupo_nome, emailError);
      }
      try {
        await sendNewUserNotificationEmail({ group: savedGroup, user });
      } catch (emailError) {
        console.error("Falha ao notificar sobre novo usuário:", savedGroup.grupo_nome, emailError);
      }
    }
  }
  revalidateGroupAdminPaths(grupoId);
  revalidatePath("/admin/relatorios");
  revalidatePath("/responsavel/relatorios");
  const status =
    existingGroup && previousEmail !== nextEmail && activationInviteSent
      ? "activation-invite-sent"
      : existingGroup
        ? "saved"
        : "created";
  const returnPath = groupReturnPath(grupoId, isAdmin, stayOnNewGroupPage);
  redirect(`${returnPath}${returnPath.includes("?") ? "&" : "?"}status=${status}`);
}

export async function saveGrupoServidoresMesaAction(
  _state: SaveGrupoState,
  formData: FormData,
): Promise<SaveGrupoState> {
  const grupoId = text(formData, "grupo_id");
  const current = await requireAuthorizedSession();
  if (!grupoId || !canAccessGroup(current.access, grupoId)) redirect("/");

  let parsedServidoresMesa: ReturnType<typeof parseServidoresMesaPayload>;
  try {
    parsedServidoresMesa = parseServidoresMesaPayload(formData, grupoId);
  } catch {
    return { error: "Revise os servidores da mesa antes de salvar." };
  }
  if (!parsedServidoresMesa) {
    return { error: "Revise os servidores da mesa antes de salvar." };
  }
  if ("error" in parsedServidoresMesa) {
    return { error: parsedServidoresMesa.error };
  }

  await saveGrupoServidoresMesa(grupoId, parsedServidoresMesa.data, undefined, { kind: "authenticated", email: current.access.email });
  revalidateGroupAdminPaths(grupoId);
  revalidatePath("/admin/relatorios");
  revalidatePath("/responsavel/relatorios");
  redirect(returnPathKeepingSettingsSectionOpen(
    `${groupDetailPath(grupoId, current.access.role === "administrador")}?status=saved`,
    formData,
  ));
}

export async function saveGrupoServidorMesaAction(
  _state: SaveGrupoState,
  formData: FormData,
): Promise<SaveGrupoState> {
  const grupoId = text(formData, "grupo_id");
  const current = await requireAuthorizedSession();
  if (!grupoId || !canAccessGroup(current.access, grupoId)) redirect("/");

  const parsed = servidorMesaPayloadSchema.safeParse({
    grupo_servidor_mesa_id:
      text(formData, "grupo_servidor_mesa_id") || undefined,
    encargo: text(formData, "encargo"),
    nome: text(formData, "nome"),
    data_inicio: text(formData, "data_inicio"),
    ativo: true,
    ordem: int(formData, "ordem"),
  });
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Revise o servidor da mesa antes de salvar.",
    };
  }

  try {
    await saveGrupoServidorMesa(grupoId, parsed.data, undefined, { kind: "authenticated", email: current.access.email });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o servidor da mesa.",
    };
  }
  revalidateGroupAdminPaths(grupoId);
  revalidatePath("/admin/relatorios");
  revalidatePath("/responsavel/relatorios");
  redirect(returnPathKeepingSettingsSectionOpen(
    `${groupDetailPath(grupoId, current.access.role === "administrador")}?status=saved`,
    formData,
  ));
}

export async function deactivateGrupoServidorMesaAction(formData: FormData) {
  const grupoId = text(formData, "grupo_id");
  const servidorId = text(formData, "grupo_servidor_mesa_id");
  const current = await requireAuthorizedSession();
  if (!grupoId || !canAccessGroup(current.access, grupoId)) redirect("/");

  await deactivateGrupoServidorMesa(grupoId, servidorId, undefined, { kind: "authenticated", email: current.access.email });
  revalidateGroupAdminPaths(grupoId);
  revalidatePath("/admin/relatorios");
  revalidatePath("/responsavel/relatorios");
  redirect(returnPathKeepingSettingsSectionOpen(
    `${groupDetailPath(grupoId, current.access.role === "administrador")}?status=saved`,
    formData,
  ));
}

export async function deactivateGrupoAction(formData: FormData) {
  const grupoId = text(formData, "grupo_id");
  const current = await requireAdminSession();

  const result = await readAggregatedAtas();
  const group = result.grupos.find((item) => item.grupo_id === grupoId);
  if (!group) throw new Error("Grupo não encontrado.");

  await saveGrupo({ ...group, ativo: false }, undefined, { kind: "authenticated", email: current.access.email });

  revalidateGroupAdminPaths(grupoId);
  redirect(`${ADMIN_GROUPS_PATH}?status=deactivated`);
}

export async function rotateAtaLinkAction(formData: FormData) {
  const grupoId = text(formData, "grupo_id");
  const current = await requireAuthorizedSession();
  if (!canAccessGroup(current.access, grupoId)) redirect("/");

  const result = await readAggregatedAtas();
  const group = result.grupos.find((item) => item.grupo_id === grupoId);
  if (!group) throw new Error("Grupo não encontrado.");

  await saveGrupo({
    ...group,
    link_formulario_ata: uniqueAtaLinkToken(result.grupos, grupoId),
  }, undefined, { kind: "authenticated", email: current.access.email });

  revalidateGroupAdminPaths(grupoId);
  redirect(
    `${groupDetailPath(grupoId, current.access.role === "administrador")}?status=ata-link-rotated`,
  );
}

export async function rotateActivationInviteAction(formData: FormData) {
  const grupoId = text(formData, "grupo_id");
  const current = await requireAdminSession();

  const result = await readAggregatedAtas();
  const group = result.grupos.find((item) => item.grupo_id === grupoId);
  if (!group) throw new Error("Grupo não encontrado.");

  const user = await rotatePendingActivationForGroup(grupoId, current.access.email);
  if (!user) {
    revalidateGroupAdminPaths(grupoId);
    redirect(`${adminGroupPath(grupoId)}?status=activation-invite-unavailable`);
  }

  let emailSent = false;
  try {
    await sendActivationEmail({ group, user });
    emailSent = true;
  } catch (emailError) {
    console.error(
      "Falha ao reenviar e-mail de ativação para o grupo:",
      group.grupo_nome,
      emailError,
    );
  }

  revalidateGroupAdminPaths(grupoId);
  redirect(
    `${adminGroupPath(grupoId)}?status=${
      emailSent
        ? "activation-invite-rotated"
        : "activation-invite-rotated-email-failed"
    }`,
  );
}

export async function deleteGrupoAction(formData: FormData) {
  return deactivateGrupoAction(formData);
}

export async function activateGrupoAction(formData: FormData) {
  const grupoId = text(formData, "grupo_id");
  const current = await requireAdminSession();

  const result = await readAggregatedAtas();
  const group = result.grupos.find((item) => item.grupo_id === grupoId);
  if (!group) throw new Error("Grupo não encontrado.");

  if (group.ativo) {
    revalidateGroupAdminPaths(grupoId);
    return redirect(`${ADMIN_GROUPS_PATH}?status=already-active`);
  }

  await saveGrupo({ ...group, ativo: true }, undefined, { kind: "authenticated", email: current.access.email });

  revalidateGroupAdminPaths(grupoId);
  redirect(`${ADMIN_GROUPS_PATH}?status=activated`);
}

export async function duplicateGrupoAction(formData: FormData) {
  const grupoId = text(formData, "grupo_id");
  const current = await requireAdminSession();

  const result = await readAggregatedAtas();
  const source = result.grupos.find((item) => item.grupo_id === grupoId);
  if (!source) throw new Error("Grupo não encontrado.");

  const newGroupId = randomUUID();
  const groupName = `${source.grupo_nome} - Copia`;
  const savedGroup = await saveGrupo({
    grupo_id: newGroupId,
    zoom_id: source.zoom_id,
    grupo_nome: groupName,
    ordem: Math.max(0, ...result.grupos.map((group) => group.ordem)) + 1,
    ativo: true,
    responsavel_grupo_nome: "",
    responsavel_grupo_email: "",
    email_acesso_grupo: "",
    responsaveis_ata: source.responsaveis_ata,
    link_formulario_ata: uniqueAtaLinkToken(result.grupos, newGroupId),
    ultima_reuniao_anterior: source.ultima_reuniao_anterior,
    fuso_horario: source.fuso_horario,
    plataforma: source.plataforma,
    acesso_plataforma: source.acesso_plataforma,
  }, undefined, { kind: "authenticated", email: current.access.email });

  for (const horario of result.grupo_horarios.filter(
    (item) => item.grupo_id === grupoId && item.ativo,
  )) {
    await saveGrupoHorario({
      grupo_id: savedGroup.grupo_id,
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio,
      link_reuniao: horario.link_reuniao,
      ativo: true,
    }, undefined, { kind: "authenticated", email: current.access.email });
  }

  revalidateGroupAdminPaths(savedGroup.grupo_id);
  redirect(`${adminGroupPath(savedGroup.grupo_id)}?status=created`);
}

export async function saveHorarioAction(formData: FormData) {
  const grupoId = text(formData, "grupo_id");
  const horarioId = text(formData, "horario_id");
  const current = await requireAuthorizedSession();
  if (!canAccessGroup(current.access, grupoId)) redirect("/");

  const result = await readAggregatedAtas();
  const existingHorario = horarioId
    ? result.grupo_horarios.find(
        (item) => item.horario_id === horarioId && item.grupo_id === grupoId,
      )
    : undefined;
  const linkReuniao = formData.has("link_reuniao")
    ? text(formData, "link_reuniao")
    : existingHorario?.link_reuniao ?? "";
  const raw = {
    grupo_id: grupoId,
    dia_semana: text(formData, "dia_semana"),
    hora_inicio: text(formData, "hora_inicio"),
    link_reuniao: linkReuniao,
    ativo: bool(formData, "ativo"),
  };
  const parsed = grupoHorarioFormSchema.parse(raw);
  await saveGrupoHorario({
    horario_id: horarioId || undefined,
    ...parsed,
  }, undefined, { kind: "authenticated", email: current.access.email });
  revalidateGroupAdminPaths(grupoId);
  redirect(groupDetailPath(grupoId, current.access.role === "administrador"));
}

export async function saveHorariosGrupoAction(formData: FormData) {
  const grupoId = text(formData, "grupo_id");
  const current = await requireAuthorizedSession();
  if (!canAccessGroup(current.access, grupoId)) redirect("/");

  const parsed = horariosPayloadSchema.parse(
    JSON.parse(text(formData, "horarios") || "[]"),
  );
  const sorted = [...parsed].sort((a, b) => {
    const dayDiff = diaSemanaOrder[a.dia_semana] - diaSemanaOrder[b.dia_semana];
    return dayDiff || a.hora_inicio.localeCompare(b.hora_inicio);
  });
  await saveGrupoHorarioSet(
    grupoId,
    sorted,
    undefined,
    { kind: "authenticated", email: current.access.email },
  );

  revalidateGroupAdminPaths(grupoId);
  redirect(returnPathKeepingSettingsSectionOpen(
    groupReturnPath(grupoId, current.access.role === "administrador", bool(formData, "return_to_new_group_page")),
    formData,
  ));
}

export async function toggleHorarioAction(formData: FormData) {
  const grupoId = text(formData, "grupo_id");
  const horarioId = text(formData, "horario_id");
  const active = text(formData, "ativo") === "true";
  const current = await requireAuthorizedSession();
  if (!canAccessGroup(current.access, grupoId)) redirect("/");

  const result = await readAggregatedAtas();
  const horario = result.grupo_horarios.find(
    (item) => item.horario_id === horarioId && item.grupo_id === grupoId,
  );
  if (!horario) throw new Error("Horário não encontrado.");
  await saveGrupoHorario({ ...horario, ativo: active }, undefined, { kind: "authenticated", email: current.access.email });
  revalidateGroupAdminPaths(grupoId);
  redirect(returnPathKeepingSettingsSectionOpen(
    groupReturnPath(
      grupoId,
      current.access.role === "administrador",
      bool(formData, "return_to_new_group_page"),
    ),
    formData,
  ));
}

export async function saveGrupoPlataformaAction(formData: FormData) {
  const grupoId = text(formData, "grupo_id");
  const plataformaId = text(formData, "plataforma_id") || undefined;
  const current = await requireAuthorizedSession();
  if (!canAccessGroup(current.access, grupoId)) redirect("/");
  const group = current.access.groups.find((item) => item.grupo_id === grupoId);
  if (!group) redirect("/");
  const isAdmin = current.access.role === "administrador";
  const tipo = text(formData, "tipo");
  if (!isAdmin && !plataformaMapping.codes.includes(tipo as never)) throw new Error("Apenas administradores podem cadastrar novos tipos de plataforma.");
  const parsedPlatform = grupoPlataformaSchema.safeParse({
    plataforma_id: plataformaId ?? randomUUID(),
    grupo_id: grupoId,
    tipo: tipo as Grupo["plataforma"],
    link: text(formData, "link"),
    id_acesso: text(formData, "id_acesso"),
    senha_pin: text(formData, "senha_pin"),
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (!parsedPlatform.success) throw new Error(parsedPlatform.error.issues[0]?.message ?? "Dados da plataforma inválidos.");
  await saveGrupoPlataforma({ ...parsedPlatform.data, plataforma_id: plataformaId }, undefined, { kind: "authenticated", email: current.access.email });
  revalidateGroupAdminPaths(grupoId);
  redirect(returnPathKeepingSettingsSectionOpen(
    groupReturnPath(grupoId, isAdmin, bool(formData, "return_to_new_group_page")),
    formData,
  ));
}

export async function associateGrupoHorariosAction(formData: FormData) {
  const grupoId = text(formData, "grupo_id");
  const current = await requireAuthorizedSession();
  if (!canAccessGroup(current.access, grupoId)) redirect("/");
  const rawAssignments = formData.has("horario_id")
    ? [{ horario_id: text(formData, "horario_id"), plataforma_id: text(formData, "plataforma_id") }]
    : JSON.parse(text(formData, "assignments") || "[]");
  const assignments = z.array(z.object({ horario_id: z.string().uuid(), plataforma_id: z.string().uuid() })).parse(rawAssignments);
  await setGrupoHorarioPlataformas(grupoId, assignments, undefined, { kind: "authenticated", email: current.access.email });
  revalidateGroupAdminPaths(grupoId);
  redirect(returnPathKeepingSettingsSectionOpen(
    groupReturnPath(grupoId, current.access.role === "administrador", bool(formData, "return_to_new_group_page")),
    formData,
  ));
}

export async function deactivateGrupoPlataformaAction(formData: FormData) {
  const grupoId = text(formData, "grupo_id");
  const current = await requireAuthorizedSession();
  if (!canAccessGroup(current.access, grupoId)) redirect("/");
  await deactivateGrupoPlataforma(grupoId, text(formData, "plataforma_id"), text(formData, "transfer_to") || undefined, undefined, { kind: "authenticated", email: current.access.email });
  revalidateGroupAdminPaths(grupoId);
  redirect(returnPathKeepingSettingsSectionOpen(
    groupReturnPath(grupoId, current.access.role === "administrador", bool(formData, "return_to_new_group_page")),
    formData,
  ));
}
