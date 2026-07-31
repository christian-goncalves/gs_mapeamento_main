import { describe, expect, it } from "vitest";
import {
  calculateMonthlyMeetings,
  createMonthlySimulationPlan,
  normalizeSimulationNames,
  resolveSimulationGroup,
  SimulationConflictError,
  validateMonthlySimulation,
} from "./ata-simulation";
import { servidorFuncoesSimulacao } from "./enums";
import type { Grupo, GrupoHorario } from "./schemas";

const groupId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
const audit = {
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};
const group: Grupo = {
  grupo_id: groupId,
  zoom_id: "123456789",
  grupo_nome: "Grupo Genérico",
  ordem: 1,
  ativo: true,
  responsavel_grupo_nome: "",
  responsavel_grupo_email: "",
  email_acesso_grupo: "",
  responsaveis_ata: "",
  link_formulario_ata: "",
  ultima_reuniao_anterior: 0,
  ...audit,
};

function schedule(
  dia_semana: GrupoHorario["dia_semana"],
  hora_inicio: GrupoHorario["hora_inicio"],
  ativo = true,
  suffix = "1",
): GrupoHorario {
  return {
    horario_id: `93ef9660-8c64-4b51-9bc5-09069ce629c${suffix}`,
    grupo_id: groupId,
    dia_semana,
    hora_inicio,
    link_reuniao: "",
    ativo,
    ...audit,
  };
}

const names = ["Ana", "Bruno", "Carla", "Davi"];

function plan(
  overrides: Partial<{
    mes: number;
    ano: number;
    seed: string | number;
    servidores: string[];
  }> = {},
  schedules: GrupoHorario[] = [schedule("segunda", "20:00")],
) {
  return createMonthlySimulationPlan(
    {
      grupo: "grupo genérico",
      mes: overrides.mes ?? 8,
      ano: overrides.ano ?? 2026,
      seed: overrides.seed ?? "seed-test",
      servidores: overrides.servidores ?? names,
    },
    [group],
    schedules,
    [],
    ["Argentina", "Portugal", "Brasil"],
  );
}

describe("calendário mensal da simulação", () => {
  it.each([
    [2025, 2, "sabado", 4],
    [2024, 2, "quinta", 5],
    [2026, 4, "quarta", 5],
    [2026, 7, "quarta", 5],
  ] as const)(
    "percorre o calendário real de %i-%i",
    (year, month, weekday, expected) => {
      const meetings = calculateMonthlyMeetings(year, month, [
        {
          dia_semana: weekday,
          hora_inicio: "20:00",
          ativo: true,
        },
      ]);
      expect(meetings).toHaveLength(expected);
      expect(
        meetings.every(
          (meeting) =>
            meeting.data_reuniao.startsWith(
              `${year}-${String(month).padStart(2, "0")}-`,
            ) && meeting.dia_semana === weekday,
        ),
      ).toBe(true);
    },
  );

  it("ordena múltiplos horários no mesmo dia e ignora inativos", () => {
    const result = calculateMonthlyMeetings(2026, 8, [
      { dia_semana: "segunda", hora_inicio: "21:00", ativo: true },
      { dia_semana: "segunda", hora_inicio: "19:00", ativo: true },
      { dia_semana: "segunda", hora_inicio: "20:00", ativo: false },
    ]);
    expect(result.slice(0, 2).map((item) => item.hora_inicio)).toEqual([
      "19:00",
      "21:00",
    ]);
    expect(result.some((item) => item.hora_inicio === "20:00")).toBe(false);
  });

  it("rejeita grupo sem horários ativos", () => {
    expect(() => plan({}, [schedule("segunda", "20:00", false)])).toThrow(
      "não possui horários ativos",
    );
  });
});

describe("aleatoriedade e nomes", () => {
  it("normaliza vazios e duplicidades por caixa e acento", () => {
    expect(
      normalizeSimulationNames([" Sônia ", "", "sonia", "ANA", "ana", "Bia"]),
    ).toEqual(["Sônia", "ANA", "Bia"]);
  });

  it("rejeita grupo inexistente, inativo e nome ambíguo", () => {
    expect(() => resolveSimulationGroup("Ausente", [group])).toThrow(
      "inexistente",
    );
    expect(() =>
      resolveSimulationGroup("Grupo Genérico", [{ ...group, ativo: false }]),
    ).toThrow("inativo");
    expect(() =>
      resolveSimulationGroup("GRUPO GENERICO", [
        group,
        {
          ...group,
          grupo_id: "2bed9d1b-7fea-4cf4-9497-f0ccbcead41c",
          grupo_nome: "Grupo Generico",
        },
      ]),
    ).toThrow("ambíguo");
  });

  it("rejeita menos de dois nomes distintos", () => {
    expect(() => plan({ servidores: ["Ana", " ánA "] })).toThrow(
      "dois nomes distintos",
    );
  });

  it("produz os mesmos dados para a mesma seed e altera com outra seed", () => {
    const first = plan({ seed: "igual" });
    const second = plan({ seed: "igual" });
    const different = plan({ seed: "diferente" });
    expect(second.submissions).toEqual(first.submissions);
    expect(different.submissions).not.toEqual(first.submissions);
  });

  it("registra uma seed automática e preserva a ordem cronológica", () => {
    const result = createMonthlySimulationPlan(
      { grupo: groupId, mes: 8, ano: 2026, servidores: names },
      [group],
      [schedule("segunda", "21:00"), schedule("segunda", "19:00", true, "2")],
      [],
      ["Portugal"],
    );
    expect(result.input.seed).toMatch(/^[a-f0-9]{24}$/);
    expect(result.meetings).toEqual(
      [...result.meetings].sort(
        (first, second) =>
          first.data_reuniao.localeCompare(second.data_reuniao) ||
          first.hora_inicio.localeCompare(second.hora_inicio),
      ),
    );
  });
});

describe("conteúdo e sequências da simulação", () => {
  it("respeita servidores, participação, visitantes, ingressos e conquistas", () => {
    const result = plan(
      {},
      [
        schedule("segunda", "20:00"),
        schedule("quarta", "20:00", true, "2"),
        schedule("sexta", "20:00", true, "3"),
      ],
    );
    expect(result.submissions.length).toBeGreaterThan(12);
    let conquestPosition = 0;
    result.submissions.forEach((submission, index) => {
      expect(submission.ata.total_membros_presentes).toBeGreaterThanOrEqual(30);
      expect(submission.ata.total_membros_presentes).toBeLessThanOrEqual(60);
      expect(submission.ata.total_partilhas).toBeGreaterThanOrEqual(10);
      expect(submission.ata.total_partilhas).toBeLessThanOrEqual(17);
      expect(names).toContain(submission.ata.preenchido_por);
      expect(submission.servidores).toHaveLength(2);
      expect(submission.servidores[0].nome).not.toBe(
        submission.servidores[1].nome,
      );
      expect(
        submission.servidores.every((item) =>
          servidorFuncoesSimulacao.includes(
            item.funcao as (typeof servidorFuncoesSimulacao)[number],
          ),
        ),
      ).toBe(true);
      const national = submission.participacao.filter(
        (item) => item.pais === "Brasil",
      );
      const international = submission.participacao.filter(
        (item) => item.pais !== "Brasil",
      );
      expect(national.length).toBeGreaterThanOrEqual(10);
      expect(national.length).toBeLessThanOrEqual(20);
      expect(new Set(national.map((item) => item.localidade)).size).toBe(
        national.length,
      );
      expect(national.every((item) => [1, 2].includes(item.presencas))).toBe(
        true,
      );
      expect(international.length).toBeLessThanOrEqual(1);
      expect(international.every((item) => item.pais !== "Brasil")).toBe(true);
      expect(
        submission.participacao.reduce(
          (total, item) => total + item.presencas,
          0,
        ),
      ).toBeLessThanOrEqual(submission.ata.total_membros_presentes);
      expect(submission.visitantes.length).toBeGreaterThanOrEqual(1);
      expect(submission.visitantes.length).toBeLessThanOrEqual(2);
      expect(submission.ingressos).toHaveLength((index + 1) % 4 === 0 ? 1 : 0);
      const expectedConquests =
        index % 3 === 0 ? (conquestPosition % 2 === 0 ? 1 : 2) : 0;
      expect(submission.trocas_chaveiro).toHaveLength(expectedConquests);
      expect(
        submission.trocas_chaveiro.every((item) => item.quantidade === 1),
      ).toBe(true);
      expect(
        new Set(submission.trocas_chaveiro.map((item) => item.tempo_limpo)).size,
      ).toBe(expectedConquests);
      if (index % 3 === 0) conquestPosition += 1;
    });
  });

  it("aborta o mês inteiro e informa todos os conflitos existentes", () => {
    const generated = plan();
    const conflicts = generated.submissions.slice(0, 2).map(({ ata }) => ({
      grupo_id: ata.grupo_id,
      data_reuniao: ata.data_reuniao,
      hora_inicio: ata.hora_inicio,
    }));
    expect(() =>
      createMonthlySimulationPlan(
        generated.input,
        [group],
        [schedule("segunda", "20:00")],
        conflicts,
        ["Portugal"],
      ),
    ).toThrow(SimulationConflictError);
    try {
      createMonthlySimulationPlan(
        generated.input,
        [group],
        [schedule("segunda", "20:00")],
        conflicts,
        ["Portugal"],
      );
    } catch (error) {
      expect((error as SimulationConflictError).conflicts).toEqual(conflicts);
    }
  });

  it("rejeita duplicidade interna no conjunto mensal", () => {
    const generated = plan();
    const invalid = {
      ...generated,
      meetings: [...generated.meetings, generated.meetings[0]],
      submissions: [...generated.submissions, generated.submissions[0]],
    };
    expect(() => validateMonthlySimulation(invalid)).toThrow(
      "Chave mensal duplicada",
    );
  });
});
