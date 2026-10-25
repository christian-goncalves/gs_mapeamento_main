import { describe, expect, it } from "vitest";
import {
  requireActiveGroupForCreation,
  resolveHistoricalGroup,
  validateContractIntegrity,
  type ContractRows,
} from "./integrity";
import type { Ata, Grupo, Servidor, Ingresso } from "./schemas";

const audit = {
  created_at: "2026-06-21T12:00:00.000Z",
  updated_at: "2026-06-21T12:00:00.000Z",
};
const group = {
  grupo_id: "fccced1d-92a5-4d24-b5af-da65cbbe467f",
  zoom_id: "001",
  grupo_nome: "Grupo",
  ordem: 1,
  ativo: true,
  responsavel_grupo_nome: "",
  responsavel_grupo_email: "",
  email_acesso_grupo: "",
  responsaveis_ata: "",
  link_formulario_ata: "grupo",
  ultima_reuniao_anterior: 0,
  ...audit,
} satisfies Grupo;
const ata = {
  ata_id: "93ef9660-8c64-4b51-9bc5-09069ce629c1",
  numero_sequencial_grupo: 1,
  indice_personalizado_grupo: 1,
  grupo_id: group.grupo_id,
  data_reuniao: "2026-06-21",
  hora_inicio: "10:30",
  duracao: "",
  formato_outros: "",
  preenchido_por: "Patricia",
  plataforma: "zoom",
  tipo_reuniao: "aberta",
  formatos: ["partilha"],
  total_membros_presentes: 1,
  total_partilhas: 1,
  ...audit,
} satisfies Ata;

function row<T>(sheet: string, rowNumber: number, data: T) {
  return { valid: true as const, sheet, rowNumber, data };
}

describe("integridade entre linhas", () => {
  it("valida existência, estado, grupo e unicidade de plataforma", () => {
    const platformId = "22222222-2222-4222-8222-222222222222";
    const schedule = row("grupo_horarios", 2, { horario_id: "33333333-3333-4333-8333-333333333333", grupo_id: group.grupo_id, dia_semana: "segunda", hora_inicio: "20:00", plataforma_id: platformId, ativo: true, link_reuniao: "", ...audit });
    const platform = row("grupo_plataformas", 2, { plataforma_id: platformId, grupo_id: group.grupo_id, tipo: "zoom", link: "https://example.org", id_acesso: "", senha_pin: "", ativo: true, ...audit });
    const base = { grupos: [], grupo_horarios: [schedule], grupo_plataformas: [platform], grupo_servidores_mesa: [], atas: [], servidores: [], participacao: [], visitantes: [], ingressos: [], trocas_chaveiro: [] } as unknown as ContractRows;
    expect(validateContractIntegrity(base)).toEqual([]);
    expect(validateContractIntegrity({ ...base, grupo_plataformas: [] })).toContainEqual(expect.objectContaining({ field: "plataforma_id", message: "plataforma_id não referencia uma plataforma existente." }));
    expect(validateContractIntegrity({ ...base, grupo_plataformas: [row("grupo_plataformas", 2, { ...platform.data, ativo: false })] })).toContainEqual(expect.objectContaining({ field: "plataforma_id", message: "plataforma_id referencia uma plataforma inativa." }));
    expect(validateContractIntegrity({ ...base, grupo_plataformas: [row("grupo_plataformas", 2, { ...platform.data, grupo_id: "44444444-4444-4444-8444-444444444444" })] })).toContainEqual(expect.objectContaining({ field: "plataforma_id", message: "A plataforma pertence a outro grupo." }));
    expect(validateContractIntegrity({ ...base, grupo_horarios: [], grupo_plataformas: [platform, row("grupo_plataformas", 3, { ...platform.data, plataforma_id: "55555555-5555-4555-8555-555555555555" })] })).toContainEqual(expect.objectContaining({ field: "tipo", message: "Já existe uma plataforma ativa deste tipo para o grupo." }));
  });

  it("rejeita IDs duplicados com aba, linha e campo", () => {
    const rows = {
      grupos: [row("grupos", 2, group), row("grupos", 8, { ...group, ordem: 2 })],
      grupo_horarios: [],
      grupo_servidores_mesa: [],
      atas: [],
      servidores: [],
      participacao: [],
      visitantes: [],
      ingressos: [],
      trocas_chaveiro: [],
    } satisfies ContractRows;
    expect(validateContractIntegrity(rows)).toContainEqual({
      sheet: "grupos",
      rowNumber: 8,
      field: "grupo_id",
      message: "grupo_id duplicado.",
    });
  });

  it("não exige vínculo técnico entre ingresso e visitante", () => {
    const ticket = {
      ingresso_id: "5c3e7ec5-1d30-4e92-a0fb-389d7afed99d",
      ata_id: ata.ata_id,
      nome: "ingresso_1",
      cidade: "Itajaí - SC",
      ...audit,
    } satisfies Ingresso;
    const rows = {
      grupos: [], grupo_horarios: [], grupo_servidores_mesa: [], atas: [],
      servidores: [], participacao: [], visitantes: [],
      ingressos: [row("ingressos", 2, ticket)], trocas_chaveiro: [],
    } satisfies ContractRows;
    expect(validateContractIntegrity(rows)).toEqual([]);
  });

  it("permite ordem de grupo duplicada porque a ordenação é alfabética", () => {
    const rows = {
      grupos: [
        row("grupos", 2, group),
        row("grupos", 3, {
          ...group,
          grupo_id: "2bed9d1b-7fea-4cf4-9497-f0ccbcead41c",
          link_formulario_ata: "outro-grupo",
        }),
      ],
      grupo_horarios: [],
      grupo_servidores_mesa: [],
      atas: [], servidores: [], participacao: [], visitantes: [], ingressos: [], trocas_chaveiro: [],
    } satisfies ContractRows;
    expect(validateContractIntegrity(rows)).toEqual([]);
  });

  it("valida identificadores de ata apenas dentro do mesmo grupo", () => {
    const otherGroupId = "2bed9d1b-7fea-4cf4-9497-f0ccbcead41c";
    const rows = {
      grupos: [],
      grupo_horarios: [],
      grupo_servidores_mesa: [],
      atas: [
        row("atas", 2, ata),
        row("atas", 3, {
          ...ata,
          ata_id: "dbca5f07-744f-4e9f-9169-f7f66d4cbbcc",
          grupo_id: otherGroupId,
        }),
        row("atas", 4, {
          ...ata,
          ata_id: "a4e54dd9-8e3f-4d56-a932-00ea5c13fc88",
        }),
      ],
      servidores: [],
      participacao: [],
      visitantes: [],
      ingressos: [],
      trocas_chaveiro: [],
    } satisfies ContractRows;
    expect(validateContractIntegrity(rows)).toEqual([
      expect.objectContaining({
        sheet: "atas",
        rowNumber: 4,
        field: "numero_sequencial_grupo",
      }),
      expect.objectContaining({
        sheet: "atas",
        rowNumber: 4,
        field: "indice_personalizado_grupo",
      }),
    ]);
  });

  it("rejeita ordem de servidor repetida apenas na mesma ata", () => {
    const server = {
      servidor_id: "a4e54dd9-8e3f-4d56-a932-00ea5c13fc88",
      ata_id: "93ef9660-8c64-4b51-9bc5-09069ce629c1",
      nome: "Maria",
      funcao: "",
      ordem: 1,
      ...audit,
    } satisfies Servidor;
    const rows = {
      grupos: [], atas: [],
      grupo_horarios: [],
      grupo_servidores_mesa: [],
      servidores: [
        row("servidores", 2, server),
        row("servidores", 3, {
          ...server,
          servidor_id: "dbca5f07-744f-4e9f-9169-f7f66d4cbbcc",
        }),
      ],
      participacao: [], visitantes: [], ingressos: [], trocas_chaveiro: [],
    } satisfies ContractRows;
    expect(validateContractIntegrity(rows)).toEqual([
      expect.objectContaining({ sheet: "servidores", rowNumber: 3, field: "ordem" }),
    ]);
  });

  it("exige grupo existente e ativo durante criação", () => {
    expect(() => requireActiveGroupForCreation(group.grupo_id, [group])).not.toThrow();
    expect(() => requireActiveGroupForCreation(group.grupo_id, [{ ...group, ativo: false }])).toThrow("inativo");
    expect(() => requireActiveGroupForCreation("2bed9d1b-7fea-4cf4-9497-f0ccbcead41c", [group])).toThrow("inexistente");
  });

  it("permite histórico de grupo inativo, mas não inexistente", () => {
    expect(resolveHistoricalGroup(group.grupo_id, [{ ...group, ativo: false }])).toMatchObject({ ativo: false });
    expect(() => resolveHistoricalGroup("2bed9d1b-7fea-4cf4-9497-f0ccbcead41c", [group])).toThrow("inexistente");
  });
});
