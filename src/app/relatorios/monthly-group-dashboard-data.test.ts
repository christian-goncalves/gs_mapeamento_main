import { describe, expect, it } from "vitest";
import type { AggregatedRead } from "@/domain/aggregate";
import {
  achievementColors,
  buildMonthlyDashboardData,
} from "./monthly-group-dashboard-data";

const groupId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
const audit = {
  created_at: "2026-08-01T12:00:00.000Z",
  updated_at: "2026-08-01T12:00:00.000Z",
};

function ata({
  id,
  date,
  present,
  localidades,
  estados,
  ingressos,
  conquistas,
}: {
  id: string;
  date: string;
  present: number;
  localidades: number;
  estados: string[];
  ingressos: number;
  conquistas: number;
}) {
  return {
    grupo: {
      grupo_id: groupId,
      zoom_id: "001",
      grupo_nome: "USL",
      ordem: 1,
      ativo: true,
      responsavel_grupo_nome: "",
      responsavel_grupo_email: "",
      email_acesso_grupo: "grupo@example.com",
      responsaveis_ata: "",
      link_formulario_ata: "grupo-usl",
      ultima_reuniao_anterior: 0,
      fuso_horario: "America/Sao_Paulo" as const,
      plataforma: "zoom" as const,
      acesso_plataforma: "001",
      ...audit,
    },
    registro: {
      ata: {
        ata_id: id,
        numero_sequencial_grupo: 1,
        indice_personalizado_grupo: 1,
        grupo_id: groupId,
        data_reuniao: date,
        hora_inicio: "09:00",
        duracao: "",
        formato_outros: "",
        preenchido_por: "Ana",
        plataforma: "zoom" as const,
        tipo_reuniao: "aberta" as const,
        formatos: ["partilha" as const],
        total_membros_presentes: present,
        total_partilhas: 1,
        status_registro: "ativa" as const,
        status_aprovacao: "aprovada" as const,
        ...audit,
      },
      servidores: [],
      participacao: Array.from({ length: localidades }, (_, index) => ({
        participacao_id: `${id}-${index}`,
        ata_id: id,
        localidade: `Cidade ${index}`,
        estado: estados[index % estados.length],
        pais: "Brasil",
        presencas: 1,
        ...audit,
      })),
      visitantes: [],
      ingressos: Array.from({ length: ingressos }, (_, index) => ({
        ingresso_id: `${id}-ingresso-${index}`,
        ata_id: id,
        nome: "Anonimo",
        cidade: "São Paulo - SP",
        ...audit,
      })),
      trocas_chaveiro: conquistas
        ? [
            {
              troca_chaveiro_id: `${id}-troca`,
              ata_id: id,
              tempo_limpo: "dias_30" as const,
              quantidade: conquistas,
              ...audit,
            },
          ]
        : [],
    },
    indicadores: {
      total_localidades: localidades,
      total_estados: new Set(estados).size,
      total_paises: 1,
      total_visitantes: 0,
      total_ingressos: ingressos,
      total_partilhas: 1,
      total_trocas_chaveiro: conquistas,
      membros_sem_localidade: present - localidades,
    },
  };
}

describe("dashboard mensal do grupo", () => {
  it("usa as cores extraídas do relatório aprovado", () => {
    expect(achievementColors).toEqual({
      ingresso: "#FFFFFF",
      dias_30: "#FAA514",
      dias_60: "#77D46C",
      dias_90: "#F24449",
      meses_6: "#5F8DDD",
      meses_9: "#F7F838",
      ano_1: "#DFDEDF",
      meses_18: "#A1A0A0",
      multiplos_anos: "#272727",
    });
  });

  it("calcula reuniões esperadas, ausentes e médias por ata enviada", () => {
    const result: AggregatedRead = {
      grupos: [
        {
          grupo_id: groupId,
          zoom_id: "001",
          grupo_nome: "USL",
          ordem: 1,
          ativo: true,
          responsavel_grupo_nome: "",
          responsavel_grupo_email: "",
          email_acesso_grupo: "grupo@example.com",
          responsaveis_ata: "",
          link_formulario_ata: "grupo-usl",
          ultima_reuniao_anterior: 0,
          fuso_horario: "America/Sao_Paulo",
          plataforma: "zoom",
          acesso_plataforma: "001",
          ...audit,
        },
      ],
      grupo_horarios: [
        {
          horario_id: "a0b4f0fa-37f4-4a69-8ebb-a1b40e538c2d",
          grupo_id: groupId,
          dia_semana: "segunda",
          hora_inicio: "09:00",
          link_reuniao: "",
          ativo: true,
          ...audit,
        },
      ],
      grupo_servidores_mesa: [],
      atas: [
        ata({
          id: "93ef9660-8c64-4b51-9bc5-09069ce629c1",
          date: "2026-08-03",
          present: 10,
          localidades: 5,
          estados: ["BA", "SP"],
          ingressos: 1,
          conquistas: 2,
        }),
        ata({
          id: "dbca5f07-744f-4e9f-9169-f7f66d4cbbcc",
          date: "2026-08-10",
          present: 15,
          localidades: 7,
          estados: ["BA", "RJ", "SP"],
          ingressos: 2,
          conquistas: 1,
        }),
      ],
      diagnostics: [],
    };

    const dashboard = buildMonthlyDashboardData(result, {
      grupoId: groupId,
      month: 8,
      year: 2026,
    });

    expect(dashboard.consolidated.totalReunioes).toBe(5);
    expect(dashboard.consolidated.reunioesSemAtaOuSalaFechada).toBe(3);
    expect(dashboard.consolidated.totalPresencas).toBe(25);
    expect(dashboard.consolidated.mediaPresencas).toBe(13);
    expect(dashboard.consolidated.mediaLocalidades).toBe(6);
    expect(dashboard.consolidated.mediaEstados).toBe(3);
    expect(dashboard.consolidated.ingressos).toBe(3);
    expect(dashboard.achievements.subtotal).toBe(3);
    expect(dashboard.achievements.total).toBe(6);
  });
});
