import { describe, expect, it } from "vitest";
import {
  ataSchema,
  grupoSchema,
  ingressoSchema,
  participacaoSchema,
  servidorSchema,
  trocaChaveiroSchema,
  visitanteSchema,
  grupoHorarioSchema,
} from "./schemas";

const grupoId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
const ataId = "93ef9660-8c64-4b51-9bc5-09069ce629c1";
const audit = {
  created_at: "2026-06-21T12:00:00.000Z",
  updated_at: "2026-06-21T12:00:00.000Z",
};

const valid = {
  grupo: {
    grupo_id: grupoId,
    zoom_id: "001",
    grupo_nome: "Grupo",
    ordem: 1,
    ativo: true,
    responsavel_grupo_nome: "Responsável",
    responsavel_grupo_email: "responsavel@example.com",
    email_acesso_grupo: "grupo@example.com",
    responsaveis_ata: "Equipe de ata",
    link_formulario_ata: "grupo",
    ultima_reuniao_anterior: 12,
    ...audit,
  },
  grupoHorario: {
    horario_id: "a0b4f0fa-37f4-4a69-8ebb-a1b40e538c2d",
    grupo_id: grupoId,
    dia_semana: "segunda",
    hora_inicio: "20:30",
    link_reuniao: "https://example.com/reuniao",
    ativo: true,
    ...audit,
  },
  ata: {
    ata_id: ataId,
    grupo_id: grupoId,
    data_reuniao: "2026-06-21",
    hora_inicio: "10:30",
    duracao: "1:30",
    formato_outros: "",
    preenchido_por: "Patricia",
    plataforma: "zoom",
    tipo_reuniao: "aberta",
    formatos: ["partilha"],
    total_membros_presentes: 3,
    total_partilhas: 2,
    ...audit,
  },
  servidor: {
    servidor_id: "a4e54dd9-8e3f-4d56-a932-00ea5c13fc88",
    ata_id: ataId,
    nome: "Maria",
    funcao: "Secretária",
    ordem: 1,
    ...audit,
  },
  participacao: {
    participacao_id: "e7918765-a98d-46bf-86f8-e6deef3190a2",
    ata_id: ataId,
    localidade: "Salvador",
    estado: "BA",
    pais: "Brasil",
    presencas: 1,
    ...audit,
  },
  visitante: {
    visitante_id: "a86f8bc3-e943-48e8-8853-cabbb41ab071",
    ata_id: ataId,
    nome: "João",
    cidade: "São Paulo - SP",
    categoria: "provavel_adicto",
    origem_contato: "internet",
    ...audit,
  },
  ingresso: {
    ingresso_id: "5c3e7ec5-1d30-4e92-a0fb-389d7afed99d",
    ata_id: ataId,
    nome: "Ingressante",
    cidade: "São Paulo - SP",
    ...audit,
  },
  troca: {
    troca_chaveiro_id: "e13f1e7e-e67e-4482-a5e0-897bb52a50d5",
    ata_id: ataId,
    tempo_limpo: "1M",
    quantidade: 2,
    ...audit,
  },
} as const;

describe("schemas de domínio", () => {
  it.each([
    ["grupos", grupoSchema, valid.grupo],
    ["grupo_horarios", grupoHorarioSchema, valid.grupoHorario],
    ["atas", ataSchema, valid.ata],
    ["servidores", servidorSchema, valid.servidor],
    ["participacao", participacaoSchema, valid.participacao],
    ["visitantes", visitanteSchema, valid.visitante],
    ["ingressos", ingressoSchema, valid.ingresso],
    ["trocas_chaveiro", trocaChaveiroSchema, valid.troca],
  ])("aceita caso válido de %s", (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(true);
  });

  it.each([
    ["grupos", grupoSchema, { ...valid.grupo, grupo_id: "invalido" }],
    [
      "grupo_horarios",
      grupoHorarioSchema,
      { ...valid.grupoHorario, dia_semana: "feriado" },
    ],
    ["atas", ataSchema, { ...valid.ata, formatos: [] }],
    ["servidores", servidorSchema, { ...valid.servidor, ordem: 0 }],
    [
      "participacao",
      participacaoSchema,
      { ...valid.participacao, presencas: 0 },
    ],
    [
      "visitantes",
      visitanteSchema,
      { ...valid.visitante, cidade: "Inexistente - SP" },
    ],
    ["ingressos", ingressoSchema, { ...valid.ingresso, nome: "" }],
    ["ingressos", ingressoSchema, { ...valid.ingresso, cidade: "" }],
    [
      "trocas_chaveiro",
      trocaChaveiroSchema,
      { ...valid.troca, tempo_limpo: "10 dias" },
    ],
    [
      "trocas_chaveiro",
      trocaChaveiroSchema,
      { ...valid.troca, quantidade: 0 },
    ],
  ])("rejeita caso inválido de %s", (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });

  it("exige intervalo de meia hora", () => {
    expect(ataSchema.safeParse({ ...valid.ata, hora_inicio: "10:15" }).success).toBe(false);
  });

  it("rejeita total de partilhas negativo", () => {
    expect(ataSchema.safeParse({ ...valid.ata, total_partilhas: -1 }).success).toBe(false);
  });

  it("exige estado para Brasil", () => {
    expect(participacaoSchema.safeParse({ ...valid.participacao, estado: "" }).success).toBe(false);
  });

  it("exige estado vazio para outros países", () => {
    expect(participacaoSchema.safeParse({ ...valid.participacao, pais: "Portugal" }).success).toBe(false);
  });
});
