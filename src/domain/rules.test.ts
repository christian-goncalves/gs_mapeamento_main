import { describe, expect, it } from "vitest";
import { ataCompletaSchema, calcularIndicadores } from "./rules";

const ataId = "93ef9660-8c64-4b51-9bc5-09069ce629c1";
const audit = {
  created_at: "2026-06-21T12:00:00.000Z",
  updated_at: "2026-06-21T12:00:00.000Z",
};
const base = {
  ata: {
    ata_id: ataId,
    grupo_id: "fccced1d-92a5-4d24-b5af-da65cbbe467f",
    data_reuniao: "2026-06-21",
    hora_inicio: "10:30",
    duracao: "",
    formato_outros: "",
    preenchido_por: "Patricia",
    plataforma: "zoom",
    tipo_reuniao: "aberta",
    formatos: ["partilha"],
    total_membros_presentes: 3,
    total_partilhas: 4,
    ...audit,
  },
  servidores: [],
  visitantes: [],
  ingressos: [
    {
      ingresso_id: "5c3e7ec5-1d30-4e92-a0fb-389d7afed99d",
      ata_id: ataId,
      nome: "Anonimo",
      cidade: "São Paulo - SP",
      ...audit,
    },
  ],
  trocas_chaveiro: [],
  participacao: [
    {
      participacao_id: "e7918765-a98d-46bf-86f8-e6deef3190a2",
      ata_id: ataId,
      localidade: "Salvador",
      estado: "BA",
      pais: "Brasil",
      presencas: 2,
      ...audit,
    },
  ],
};

describe("regras agregadas", () => {
  it("rejeita presenças acima do total", () => {
    const result = ataCompletaSchema.safeParse({
      ...base,
      ata: { ...base.ata, total_membros_presentes: 1 },
    });
    expect(result.success).toBe(false);
  });

  it("calcula indicadores sem persistência", () => {
    const parsed = ataCompletaSchema.parse(base);
    expect(calcularIndicadores(parsed)).toMatchObject({
      total_localidades: 1,
      total_paises: 1,
      total_ingressos: 1,
      total_partilhas: 4,
      total_trocas_chaveiro: 0,
      membros_sem_localidade: 1,
    });
  });
});
