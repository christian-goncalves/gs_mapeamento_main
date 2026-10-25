import { describe, expect, it } from "vitest";
import type { Grupo, GrupoHorario } from "./entities";
import { buildMissingAtaOccurrences, nextMissingAtaRefreshAt } from "./missing-ata-occurrences";

const group: Grupo = {
  grupo_id: "8806319f-dd2d-4b67-9416-ab42bb991870",
  zoom_id: "2203202053",
  grupo_nome: "Bom Dia Brasil",
  ordem: 1,
  ativo: true,
  responsavel_grupo_nome: "",
  responsavel_grupo_email: "",
  email_acesso_grupo: "",
  responsaveis_ata: "",
  link_formulario_ata: "ata-bom-dia-brasil",
  ultima_reuniao_anterior: 0,
  fuso_horario: "America/Sao_Paulo",
  plataforma: "zoom",
  acesso_plataforma: "",
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
};

const schedule: GrupoHorario = {
  horario_id: "4f79f769-0057-46f3-9b2f-14454f6c16d7",
  grupo_id: group.grupo_id,
  dia_semana: "segunda",
  hora_inicio: "09:00",
  link_reuniao: "",
  ativo: true,
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
};

describe("ocorrências de ata não enviada", () => {
  const beforeCutoff = new Date("2026-10-26T13:59:00.000Z");
  const atCutoff = new Date("2026-10-26T14:00:00.000Z");

  it("só marca a reunião das 9h como não enviada ao completar duas horas", () => {
    const input = { groups: [group], schedules: [schedule], receivedMeetings: [], fromDate: "2026-10-26" };

    expect(buildMissingAtaOccurrences({ ...input, now: beforeCutoff })).toEqual([]);
    expect(buildMissingAtaOccurrences({ ...input, now: atCutoff })).toEqual([
      expect.objectContaining({
        groupId: group.grupo_id,
        date: "2026-10-26",
        time: "09:00",
      }),
    ]);
  });

  it("agenda a atualização automática para o marco das duas horas", () => {
    expect(nextMissingAtaRefreshAt({
      groups: [group],
      schedules: [schedule],
      receivedMeetings: [],
      now: beforeCutoff,
    })).toBe("2026-10-26T14:00:00.000Z");
  });

  it("conta reunião no dia em que o horário foi cadastrado, mesmo após seu início", () => {
    const sameDaySchedule = {
      ...schedule,
      dia_semana: "sexta" as const,
      hora_inicio: "18:00",
      created_at: "2026-10-23T22:54:10.608Z",
      updated_at: "2026-10-23T22:54:10.608Z",
    };
    const input = {
      groups: [group],
      schedules: [sameDaySchedule],
      receivedMeetings: [],
      fromDate: "2026-10-23",
    };

    expect(buildMissingAtaOccurrences({
      ...input,
      now: new Date("2026-10-23T22:59:00.000Z"),
    })).toEqual([]);
    expect(buildMissingAtaOccurrences({
      ...input,
      now: new Date("2026-10-23T23:00:00.000Z"),
    })).toEqual([
      expect.objectContaining({
        groupId: group.grupo_id,
        date: "2026-10-23",
        time: "18:00",
      }),
    ]);
  });

  it("não projeta falta se já existir uma ata ativa para a ocorrência", () => {
    expect(buildMissingAtaOccurrences({
      groups: [group],
      schedules: [schedule],
      receivedMeetings: [{ groupId: group.grupo_id, date: "2026-10-26", time: "09:00" }],
      fromDate: "2026-10-26",
      now: atCutoff,
    })).toEqual([]);
  });
});
