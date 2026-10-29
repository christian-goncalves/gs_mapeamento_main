import { describe, expect, it } from "vitest";
import type { Grupo, GrupoHorario } from "@/domain/entities";
import {
  buildMissingAtaRows,
  currentMonthPeriod,
  type AdminAtaRow,
} from "./admin-atas-data";

const audit = {
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

const group: Grupo = {
  grupo_id: "8806319f-dd2d-4b67-9416-ab42bb991870",
  zoom_id: "2203202053",
  grupo_nome: "USL",
  ordem: 1,
  ativo: true,
  fuso_horario: "America/Sao_Paulo",
  plataforma: "zoom",
  acesso_plataforma: "",
  responsavel_grupo_nome: "",
  responsavel_grupo_email: "",
  email_acesso_grupo: "",
  responsaveis_ata: "",
  link_formulario_ata: "ata-usl",
  ultima_reuniao_anterior: 0,
  ...audit,
};

function schedule(overrides: Partial<GrupoHorario>): GrupoHorario {
  return {
    horario_id: "4f79f769-0057-46f3-9b2f-14454f6c16d7",
    grupo_id: group.grupo_id,
    dia_semana: "domingo",
    hora_inicio: "10:00",
    link_reuniao: "",
    ativo: true,
    ...audit,
    ...overrides,
  };
}

function sent(overrides: Partial<AdminAtaRow>): AdminAtaRow {
  return {
    ataId: "835af8b6-06e8-4e51-99e8-9e6106bbde7f",
    numeroAta: 1,
    data: "2026-07-05",
    horario: "10:00",
    grupoId: group.grupo_id,
    grupo: group.grupo_nome,
    preenchidoPor: "ALISSON",
    status: "Enviada",
    ...overrides,
  };
}

describe("admin atas data", () => {
  it("calcula o periodo do mes atual ate a data de referencia", () => {
    expect(currentMonthPeriod(new Date("2026-07-18T12:00:00.000Z"))).toEqual({
      start: "2026-07-01",
      end: "2026-07-18",
      key: "2026-07",
    });
  });

  it("lista reunioes previstas sem ata correspondente por grupo, data e horario", () => {
    const missing = buildMissingAtaRows({
      grupos: [group],
      horarios: [
        schedule({ dia_semana: "domingo", hora_inicio: "10:00" }),
        schedule({ dia_semana: "domingo", hora_inicio: "18:00" }),
        schedule({ dia_semana: "segunda", hora_inicio: "21:30", ativo: false }),
      ],
      sentRows: [sent({ data: "2026-07-05", horario: "10:00" })],
      start: "2026-07-01",
      end: "2026-07-06",
      now: new Date("2026-07-06T01:30:00.000Z"),
    });

    expect(missing).toEqual([
      expect.objectContaining({
        data: "2026-07-05",
        horario: "18:00",
        grupoId: group.grupo_id,
        status: "Não enviada",
      }),
    ]);
  });
});
