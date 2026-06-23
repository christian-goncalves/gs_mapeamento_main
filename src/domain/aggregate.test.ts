import { describe, expect, it } from "vitest";
import { aggregateContractRows, type ParsedContractRows } from "./aggregate";
import type { ParsedRow, RowDiagnostic } from "@/lib/sheets/rows";

const grupoId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
const ataId = "93ef9660-8c64-4b51-9bc5-09069ce629c1";
const audit = {
  created_at: "2026-06-21T12:00:00.000Z",
  updated_at: "2026-06-21T12:00:00.000Z",
};
const group = {
  grupo_id: grupoId,
  zoom_id: "001",
  grupo_nome: "Grupo Histórico",
  ordem: 1,
  ativo: false,
  ...audit,
};
const ata = {
  ata_id: ataId,
  grupo_id: grupoId,
  data_reuniao: "2026-06-21",
  hora_inicio: "10:30",
  plataforma: "zoom" as const,
  tipo_reuniao: "aberta" as const,
  formatos: ["partilha" as const],
  total_membros_presentes: 3,
  total_partilhas: 1,
  ...audit,
};

function valid<T>(sheet: string, rowNumber: number, data: T) {
  return { valid: true as const, sheet, rowNumber, data };
}

function invalid(
  sheet: string,
  rowNumber: number,
  field: string,
): ParsedRow<never> {
  const diagnostic: RowDiagnostic = {
    sheet,
    rowNumber,
    field,
    message: "Valor inválido.",
  };
  return { valid: false, sheet, rowNumber, diagnostics: [diagnostic] };
}

function baseRows(): ParsedContractRows {
  return {
    grupos: [valid("grupos", 2, group)],
    atas: [valid("atas", 2, ata)],
    servidores: [
      valid("servidores", 2, {
        servidor_id: "a4e54dd9-8e3f-4d56-a932-00ea5c13fc88",
        ata_id: ataId,
        nome: "Maria",
        ordem: 1,
        ...audit,
      }),
    ],
    participacao: [
      valid("participacao", 2, {
        participacao_id: "e7918765-a98d-46bf-86f8-e6deef3190a2",
        ata_id: ataId,
        localidade: "Salvador",
        estado: "BA",
        pais: "Brasil",
        presencas: 2,
        ...audit,
      }),
    ],
    visitantes: [
      valid("visitantes", 2, {
        visitante_id: "a86f8bc3-e943-48e8-8853-cabbb41ab071",
        ata_id: ataId,
        nome: "João",
        cidade: "São Paulo - SP",
        categoria: "provavel_adicto" as const,
        origem_contato: "internet" as const,
        ...audit,
      }),
    ],
    ingressos: [
      valid("ingressos", 2, {
        ingresso_id: "5c3e7ec5-1d30-4e92-a0fb-389d7afed99d",
        ata_id: ataId,
        nome: "Anonimo",
        cidade: "São Paulo - SP",
        ...audit,
      }),
    ],
    trocas_chaveiro: [
      valid("trocas_chaveiro", 2, {
        troca_chaveiro_id: "e13f1e7e-e67e-4482-a5e0-897bb52a50d5",
        ata_id: ataId,
        tempo_limpo: "1M" as const,
        quantidade: 2,
        ...audit,
      }),
    ],
  };
}

describe("leitura agregada", () => {
  it("reconstrói ata completa, aceita grupo inativo e calcula indicadores", () => {
    const result = aggregateContractRows(baseRows());
    expect(result.diagnostics).toEqual([]);
    expect(result.atas).toHaveLength(1);
    expect(result.atas[0]).toMatchObject({
      grupo: { grupo_nome: "Grupo Histórico", ativo: false },
      registro: {
        servidores: [{ nome: "Maria" }],
        participacao: [{ presencas: 2 }],
        visitantes: [{ nome: "João" }],
        ingressos: [{ nome: "Anonimo", cidade: "São Paulo - SP" }],
        trocas_chaveiro: [{ tempo_limpo: "1M", quantidade: 2 }],
      },
      indicadores: {
        total_localidades: 1,
        total_estados: 1,
        total_paises: 1,
        total_visitantes: 1,
        total_ingressos: 1,
        total_partilhas: 1,
        total_trocas_chaveiro: 2,
        membros_sem_localidade: 1,
      },
    });
  });

  it("mantém diagnóstico de schema e exclui a linha inválida", () => {
    const rows = baseRows();
    rows.visitantes.push(invalid("visitantes", 9, "cidade"));
    const result = aggregateContractRows(rows);
    expect(result.atas[0].indicadores.total_visitantes).toBe(1);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ sheet: "visitantes", rowNumber: 9, field: "cidade" }),
    );
  });

  it("rejeita ingresso órfão sem afetar membros sem localidade", () => {
    const rows = baseRows();
    if (!rows.ingressos[0].valid) throw new Error("Fixture inválido.");
    rows.ingressos[0] = valid("ingressos", 10, {
      ...rows.ingressos[0].data,
      ata_id: "2bed9d1b-7fea-4cf4-9497-f0ccbcead41c",
    });
    const result = aggregateContractRows(rows);
    expect(result.atas[0].indicadores).toMatchObject({
      total_ingressos: 0,
      membros_sem_localidade: 1,
    });
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ sheet: "ingressos", rowNumber: 10, field: "ata_id" }),
    );
  });

  it("rejeita ata com grupo inexistente na linha da ata", () => {
    const rows = baseRows();
    rows.grupos = [];
    const result = aggregateContractRows(rows);
    expect(result.atas).toEqual([]);
    expect(result.diagnostics).toContainEqual({
      sheet: "atas",
      rowNumber: 2,
      field: "grupo_id",
      message: "grupo_id não referencia um grupo válido.",
    });
  });

  it("rejeita dependente órfão sem invalidar a ata", () => {
    const rows = baseRows();
    if (!rows.servidores[0].valid) throw new Error("Fixture inválido.");
    rows.servidores[0] = valid("servidores", 7, {
      ...rows.servidores[0].data,
      ata_id: "2bed9d1b-7fea-4cf4-9497-f0ccbcead41c",
    });
    const result = aggregateContractRows(rows);
    expect(result.atas).toHaveLength(1);
    expect(result.atas[0].registro.servidores).toEqual([]);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ sheet: "servidores", rowNumber: 7, field: "ata_id" }),
    );
  });

  it("isola participação manual que excede o total dos indicadores", () => {
    const rows = baseRows();
    if (!rows.participacao[0].valid) throw new Error("Fixture inválido.");
    rows.participacao[0] = valid("participacao", 11, {
      ...rows.participacao[0].data,
      presencas: 4,
    });
    const result = aggregateContractRows(rows);
    expect(result.atas[0].registro.participacao).toEqual([]);
    expect(result.atas[0].indicadores).toMatchObject({
      total_localidades: 0,
      membros_sem_localidade: 3,
    });
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        sheet: "participacao",
        rowNumber: 11,
        field: "presencas",
      }),
    );
  });

  it("isola duplicidade sem remover o primeiro registro válido", () => {
    const rows = baseRows();
    if (!rows.servidores[0].valid) throw new Error("Fixture inválido.");
    rows.servidores.push(
      valid("servidores", 8, {
        ...rows.servidores[0].data,
        nome: "Duplicado",
      }),
    );
    const result = aggregateContractRows(rows);
    expect(result.atas[0].registro.servidores).toHaveLength(1);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        sheet: "servidores",
        rowNumber: 8,
        field: "servidor_id",
      }),
    );
  });
});
