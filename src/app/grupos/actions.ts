"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  grupoFormSchema,
  grupoHorarioFormSchema,
} from "@/domain/form-schemas";
import { diaSemanaOrder, diaSemanaSchema, horaInicioSchema } from "@/domain/schemas";
import type { Grupo } from "@/domain/entities";
import { canAccessGroup } from "@/lib/auth/access";
import { sendActivationEmail } from "@/lib/email/activation-email";
import {
  requireAdminSession,
  requireAuthorizedSession,
} from "@/lib/auth/require-session";
import {
  deleteGrupoHorarios,
  saveGrupo,
  saveGrupoHorario,
} from "@/lib/sheets/group-admin";
import { syncResponsibleGroupUser } from "@/lib/sheets/group-users";
import { readAggregatedAtas } from "@/lib/sheets/repository";
import { z } from "zod";

export type SaveGrupoState = { error?: string } | null;

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
      dia_semana: diaSemanaSchema,
      hora_inicio: horaInicioSchema,
    }),
  )
  .min(1, "Informe pelo menos um horário.");

function slug(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || "grupo";
}

function uniqueSlug(base: string, groups: readonly Grupo[], currentGroupId: string) {
  const used = new Set(
    groups
      .filter((group) => group.grupo_id !== currentGroupId)
      .map((group) => group.link_formulario_ata)
      .filter(Boolean),
  );
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
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
  const raw = {
    zoom_id: text(formData, "zoom_id"),
    grupo_nome: text(formData, "grupo_nome"),
    ativo: bool(formData, "ativo"),
    responsavel_grupo_nome: text(formData, "responsavel_grupo_nome"),
    responsavel_grupo_email: text(formData, "responsavel_grupo_email"),
    email_acesso_grupo: text(formData, "email_acesso_grupo"),
    ultima_reuniao_anterior: int(formData, "ultima_reuniao_anterior"),
  };
  const parsedResult = grupoFormSchema.safeParse(raw);
  if (!parsedResult.success) {
    return {
      error: parsedResult.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const parsed = parsedResult.data;
  const ordem =
    existingGroup?.ordem ??
    Math.max(0, ...result.grupos.map((group) => group.ordem)) + 1;
  const linkFormularioAta =
    existingGroup?.link_formulario_ata ||
    uniqueSlug(slug(parsed.grupo_nome), result.grupos, grupoId);
  const groupToSave = isAdmin
    ? {
        ...parsed,
        ordem,
        responsaveis_ata: existingGroup?.responsaveis_ata ?? "",
        link_formulario_ata: linkFormularioAta,
        ultima_reuniao_anterior: parsed.ultima_reuniao_anterior,
      }
    : {
        zoom_id: parsed.zoom_id,
        grupo_nome: parsed.grupo_nome,
        ordem,
        ativo: existingGroup?.ativo ?? true,
        responsavel_grupo_nome: existingGroup?.responsavel_grupo_nome ?? "",
        responsavel_grupo_email: existingGroup?.responsavel_grupo_email ?? "",
        email_acesso_grupo: existingGroup?.email_acesso_grupo ?? "",
        responsaveis_ata: existingGroup?.responsaveis_ata ?? "",
        link_formulario_ata: linkFormularioAta,
        ultima_reuniao_anterior: existingGroup?.ultima_reuniao_anterior ?? 0,
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
  const savedGroup = await saveGrupo({
    grupo_id: grupoId,
    ...groupToSave,
  });
  let activationInviteSent = false;
  if (isAdmin) {
    const user = await syncResponsibleGroupUser(savedGroup);
    if (user?.status === "pendente" && user.inviteCreated) {
      await sendActivationEmail({ group: savedGroup, user });
      activationInviteSent = true;
    }
  }
  revalidatePath("/");
  revalidatePath("/grupos");
  revalidatePath(`/grupos/${grupoId}`);
  revalidatePath("/meu-grupo");
  const status =
    existingGroup && previousEmail !== nextEmail && activationInviteSent
      ? "activation-invite-sent"
      : existingGroup
        ? "saved"
        : "created";
  redirect(`/grupos/${grupoId}?status=${status}`);
}

export async function deleteGrupoAction(formData: FormData) {
  const grupoId = text(formData, "grupo_id");
  await requireAdminSession();

  const result = await readAggregatedAtas();
  const group = result.grupos.find((item) => item.grupo_id === grupoId);
  if (!group) throw new Error("Grupo não encontrado.");

  await saveGrupo({ ...group, ativo: false });
  for (const horario of result.grupo_horarios.filter(
    (item) => item.grupo_id === grupoId && item.ativo,
  )) {
    await saveGrupoHorario({ ...horario, ativo: false });
  }

  revalidatePath("/");
  revalidatePath("/grupos");
  revalidatePath(`/grupos/${grupoId}`);
  redirect("/grupos");
}

export async function duplicateGrupoAction(formData: FormData) {
  const grupoId = text(formData, "grupo_id");
  await requireAdminSession();

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
    link_formulario_ata: uniqueSlug(slug(groupName), result.grupos, newGroupId),
    ultima_reuniao_anterior: source.ultima_reuniao_anterior,
  });

  for (const horario of result.grupo_horarios.filter(
    (item) => item.grupo_id === grupoId && item.ativo,
  )) {
    await saveGrupoHorario({
      grupo_id: savedGroup.grupo_id,
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio,
      link_reuniao: horario.link_reuniao,
      ativo: true,
    });
  }

  revalidatePath("/");
  revalidatePath("/grupos");
  redirect(`/grupos/${savedGroup.grupo_id}?status=created`);
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
  });
  revalidatePath(`/grupos/${grupoId}`);
  revalidatePath("/meu-grupo");
  redirect(`/grupos/${grupoId}`);
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
  const keys = sorted.map((item) => `${item.dia_semana}:${item.hora_inicio}`);
  if (new Set(keys).size !== keys.length) {
    throw new Error("Existem horários duplicados. Revise dia e hora antes de salvar.");
  }

  const result = await readAggregatedAtas();
  const existing = result.grupo_horarios.filter(
    (horario) => horario.grupo_id === grupoId,
  );
  const existingByKey = new Map(
    existing.map((horario) => [
      `${horario.dia_semana}:${horario.hora_inicio}`,
      horario,
    ]),
  );
  const desiredKeys = new Set(keys);

  const horarioIdsToDelete = existing
    .filter((horario) => {
      const key = `${horario.dia_semana}:${horario.hora_inicio}`;
      return !desiredKeys.has(key);
    })
    .map((horario) => horario.horario_id);
  await deleteGrupoHorarios(horarioIdsToDelete);

  for (const horario of existing) {
    const key = `${horario.dia_semana}:${horario.hora_inicio}`;
    if (!desiredKeys.has(key)) {
      existingByKey.delete(key);
    }
  }

  for (const horario of sorted) {
    const existingHorario = existingByKey.get(
      `${horario.dia_semana}:${horario.hora_inicio}`,
    );
    await saveGrupoHorario({
      horario_id: existingHorario?.horario_id,
      grupo_id: grupoId,
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio,
      link_reuniao: existingHorario?.link_reuniao ?? "",
      ativo: true,
      created_at: existingHorario?.created_at,
    });
  }

  revalidatePath(`/grupos/${grupoId}`);
  revalidatePath("/meu-grupo");
  redirect(`/grupos/${grupoId}`);
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
  await saveGrupoHorario({ ...horario, ativo: active });
  revalidatePath(`/grupos/${grupoId}`);
  revalidatePath("/meu-grupo");
  redirect(`/grupos/${grupoId}`);
}
