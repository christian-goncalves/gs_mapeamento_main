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
  domainTrocaChaveiroToSheet,
  domainVisitanteToSheet,
  sheetAtaSchema,
  sheetAtaToDomain,
  sheetGrupoSchema,
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
    grupo_id: groupId, zoom_id: "001", grupo_nome: "Grupo", ordem: "1", ativo: "TRUE", ...audit,
  },
  ata: {
    ata_id: ataId, grupo_id: groupId, data_reuniao: "2026-06-21", hora_inicio: "10:30",
    plataforma: "Zoom", tipo_reuniao: "Aberta", formato_partilha: "TRUE",
    formato_estudo: "FALSE", formato_tematico: "FALSE", formato_literatura: "FALSE",
    formato_passos: "FALSE", formato_tradicoes: "FALSE", total_membros_presentes: "3", ...audit,
  },
  servidor: {
    servidor_id: "a4e54dd9-8e3f-4d56-a932-00ea5c13fc88", ata_id: ataId,
    nome: "Maria", ordem: "1", ...audit,
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
    tempo_limpo: "30 dias", ...audit,
  },
};

describe("schemas das linhas do Sheets", () => {
  it.each([
    ["grupos", sheetGrupoSchema, valid.grupo],
    ["atas", sheetAtaSchema, valid.ata],
    ["servidores", sheetServidorSchema, valid.servidor],
    ["participacao", sheetParticipacaoSchema, valid.participacao],
    ["visitantes", sheetVisitanteSchema, valid.visitante],
    ["trocas_chaveiro", sheetTrocaChaveiroSchema, valid.troca],
  ])("aceita linha válida de %s", (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(true);
  });

  it.each([
    ["grupos", sheetGrupoSchema, { ...valid.grupo, ativo: "sim" }],
    ["atas", sheetAtaSchema, { ...valid.ata, plataforma: "Meet" }],
    ["servidores", sheetServidorSchema, { ...valid.servidor, nome: "" }],
    ["participacao", sheetParticipacaoSchema, { ...valid.participacao, estado: "" }],
    ["visitantes", sheetVisitanteSchema, { ...valid.visitante, categoria: "Desconhecida" }],
    ["trocas_chaveiro", sheetTrocaChaveiroSchema, { ...valid.troca, tempo_limpo: "10 dias" }],
  ])("rejeita linha inválida de %s", (_name, schema, value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });

  it("converte ata do Sheets e volta sem perda", () => {
    const sheet = sheetAtaSchema.parse(valid.ata);
    expect(domainAtaToSheet(sheetAtaToDomain(sheet))).toEqual(sheet);
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

  it("converte visitante e troca sem perda", () => {
    const visitor = sheetVisitanteSchema.parse(valid.visitante);
    expect(domainVisitanteToSheet(sheetVisitanteToDomain(visitor))).toEqual(visitor);
    const keytag = sheetTrocaChaveiroSchema.parse(valid.troca);
    expect(domainTrocaChaveiroToSheet(sheetTrocaChaveiroToDomain(keytag))).toEqual(keytag);
  });
});
