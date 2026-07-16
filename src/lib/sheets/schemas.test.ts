import { describe, expect, it } from "vitest";
import {
  categoriaVisitanteMapping,
  origemContatoMapping,
  plataformaMapping,
  tempoLimpoMapping,
  tipoReuniaoMapping,
} from "@/domain/enums";
import {
  domainAtaToSheet,
  domainIngressoToSheet,
  domainTrocaChaveiroToSheet,
  domainVisitanteToSheet,
  sheetAtaSchema,
  sheetAtaBusinessKeySchema,
  sheetAtaToDomain,
  sheetGrupoSchema,
  sheetGrupoHorarioSchema,
  sheetIngressoSchema,
  sheetIngressoToDomain,
  sheetParticipacaoSchema,
  sheetServidorSchema,
  sheetTrocaChaveiroSchema,
  sheetTrocaChaveiroToDomain,
  sheetVisitanteSchema,
  sheetVisitanteToDomain,
} from "./schemas";

const groupId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
const ataId = "93ef9660-8c64-4b51-9bc5-09069ce629c1";
const audit = {
  created_at: "2026-06-21T12:00:00.000Z",
  updated_at: "2026-06-21T12:00:00.000Z",
};
const valid = {
  grupo: {
    grupo_id: groupId, zoom_id: "001", grupo_nome: "Grupo", ordem: "1", ativo: "TRUE",
    responsavel_grupo_nome: "Responsável", responsavel_grupo_email: "responsavel@example.com",
    email_acesso_grupo: "grupo@example.com", responsaveis_ata: "Equipe de ata",
    link_formulario_ata: "grupo", ultima_reuniao_anterior: "12", ...audit,
  },
  grupoHorario: {
    horario_id: "a0b4f0fa-37f4-4a69-8ebb-a1b40e538c2d", grupo_id: groupId,
    dia_semana: "segunda", hora_inicio: "20:30", link_reuniao: "https://example.com/reuniao",
    ativo: "TRUE", ...audit,
  },
  ata: {
    ata_id: ataId, grupo_id: groupId, data_reuniao: "2026-06-21", hora_inicio: "10:30",
    duracao: "1:30", formato_outros: "", preenchido_por: "Patricia", plataforma: "Zoom", tipo_reuniao: "Aberta", formato_partilha: "TRUE",
    formato_estudo: "FALSE", formato_tematico: "FALSE", formato_literatura: "FALSE",
    formato_passos: "FALSE", formato_tradicoes: "FALSE", total_membros_presentes: "3",
    total_partilhas: "2", ...audit,
  },
  servidor: {
    servidor_id: "a4e54dd9-8e3f-4d56-a932-00ea5c13fc88", ata_id: ataId,
    nome: "Maria", funcao: "Secretária", ordem: "1", ...audit,
  },
  participacao: {
    participacao_id: "e7918765-a98d-46bf-86f8-e6deef3190a2", ata_id: ataId,
    localidade: "Salvador", estado: "BA", pais: "Brasil", presencas: "1", ...audit,
  },
  visitante: {
    visitante_id: "a86f8bc3-e943-48e8-8853-cabbb41ab071", ata_id: ataId, nome: "João",
    cidade: "São Paulo - SP", categoria: "Provável adicto", origem_contato: "Internet", ...audit,
  },
  troca: {
    troca_chaveiro_id: "e13f1e7e-e67e-4482-a5e0-897bb52a50d5", ata_id: ataId,
    tempo_limpo: "1M", quantidade: "2", ...audit,
  },
  ingresso: {
    ingresso_id: "5c3e7ec5-1d30-4e92-a0fb-389d7afed99d", ata_id: ataId,
    nome: "Anonimo", cidade: "São Paulo - SP", ...audit,
  },
};

describe("schemas das linhas do Sheets", () => {
  it.each([
    ["grupos", sheetGrupoSchema, valid.grupo],
    ["grupo_horarios", sheetGrupoHorarioSchema, valid.grupoHorario],
    ["atas", sheetAtaSchema, valid.ata],
    ["servidores", sheetServidorSchema, valid.servidor],
    ["participacao", sheetParticipacaoSchema, valid.participacao],
    ["visitantes", sheetVisitanteSchema, valid.visitante],
    ["ingressos", sheetIngressoSchema, valid.ingresso],
    ["trocas_chaveiro", sheetTrocaChaveiroSchema, valid.troca],
  ])("aceita linha válida de %s", (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(true);
  });

  it.each([
    ["grupos", sheetGrupoSchema, { ...valid.grupo, ativo: "sim" }],
    ["grupo_horarios", sheetGrupoHorarioSchema, { ...valid.grupoHorario, dia_semana: "feriado" }],
    ["atas", sheetAtaSchema, { ...valid.ata, plataforma: "Meet" }],
    ["servidores", sheetServidorSchema, { ...valid.servidor, nome: "" }],
    ["participacao", sheetParticipacaoSchema, { ...valid.participacao, estado: "" }],
    ["visitantes", sheetVisitanteSchema, { ...valid.visitante, categoria: "Desconhecida" }],
    ["ingressos", sheetIngressoSchema, { ...valid.ingresso, nome: "" }],
    ["ingressos", sheetIngressoSchema, { ...valid.ingresso, cidade: "" }],
    ["trocas_chaveiro", sheetTrocaChaveiroSchema, { ...valid.troca, tempo_limpo: "10 dias" }],
    ["trocas_chaveiro", sheetTrocaChaveiroSchema, { ...valid.troca, quantidade: "0" }],
  ])("rejeita linha inválida de %s", (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });

  it("converte ata do Sheets e volta sem perda", () => {
    const sheet = sheetAtaSchema.parse(valid.ata);
    expect(domainAtaToSheet(sheetAtaToDomain(sheet))).toEqual(sheet);
  });

  it("trata colunas textuais opcionais de grupos com FALSE herdado como texto vazio", () => {
    const parsed = sheetGrupoSchema.parse({
      ...valid.grupo,
      responsavel_grupo_nome: false,
      responsavel_grupo_email: false,
      email_acesso_grupo: false,
      responsaveis_ata: false,
      link_formulario_ata: false,
    });
    expect(parsed).toMatchObject({
      responsavel_grupo_nome: "",
      responsavel_grupo_email: "",
      email_acesso_grupo: "",
      responsaveis_ata: "",
      link_formulario_ata: "",
    });
  });

  it("aceita Zoom ID numérico retornado pelo Sheets", () => {
    const parsed = sheetGrupoSchema.parse({
      ...valid.grupo,
      zoom_id: 4430251323,
    });
    expect(parsed.zoom_id).toBe("4430251323");
  });

  it("converte data e horário serializados pelo Sheets", () => {
    const parsed = sheetAtaSchema.parse({
      ...valid.ata,
      data_reuniao: 46194,
      hora_inicio: 0.4375,
    });
    expect(parsed).toMatchObject({
      data_reuniao: "2026-06-21",
      hora_inicio: "10:30",
    });
  });

  it("extrai chave de duplicidade mesmo com outra coluna inválida", () => {
    expect(
      sheetAtaBusinessKeySchema.parse({
        ...valid.ata,
        plataforma: "valor manual inválido",
      }),
    ).toEqual({
      grupo_id: groupId,
      data_reuniao: "2026-06-21",
      hora_inicio: "10:30",
    });
  });

  it("converte todos os códigos e rótulos bidirecionalmente", () => {
    for (const code of plataformaMapping.codes) {
      expect(plataformaMapping.fromSheet(plataformaMapping.toSheet(code))).toBe(code);
    }
    for (const code of tipoReuniaoMapping.codes) {
      expect(tipoReuniaoMapping.fromSheet(tipoReuniaoMapping.toSheet(code))).toBe(code);
    }
    for (const code of categoriaVisitanteMapping.codes) {
      expect(categoriaVisitanteMapping.fromSheet(categoriaVisitanteMapping.toSheet(code))).toBe(code);
    }
    for (const code of origemContatoMapping.codes) {
      expect(origemContatoMapping.fromSheet(origemContatoMapping.toSheet(code))).toBe(code);
    }
    for (const code of tempoLimpoMapping.codes) {
      expect(tempoLimpoMapping.fromSheet(tempoLimpoMapping.toSheet(code))).toBe(code);
    }
  });

  it("converte visitante, ingresso e troca sem perda", () => {
    const visitor = sheetVisitanteSchema.parse(valid.visitante);
    expect(domainVisitanteToSheet(sheetVisitanteToDomain(visitor))).toEqual(visitor);
    const ingresso = sheetIngressoSchema.parse(valid.ingresso);
    expect(domainIngressoToSheet(sheetIngressoToDomain(ingresso))).toEqual(ingresso);
    const keytag = sheetTrocaChaveiroSchema.parse(valid.troca);
    expect(domainTrocaChaveiroToSheet(sheetTrocaChaveiroToDomain(keytag))).toEqual(keytag);
  });
});
