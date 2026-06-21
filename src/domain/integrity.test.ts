import { describe, expect, it } from "vitest";
import {
  requireActiveGroupForCreation,
  resolveHistoricalGroup,
  validateContractIntegrity,
  type ContractRows,
} from "./integrity";
import type { Grupo, Servidor } from "./schemas";

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
  ...audit,
} satisfies Grupo;

function row<T>(sheet: string, rowNumber: number, data: T) {
  return { valid: true as const, sheet, rowNumber, data };
}

describe("integridade entre linhas", () => {
  it("rejeita IDs duplicados com aba, linha e campo", () => {
    const rows = {
      grupos: [row("grupos", 2, group), row("grupos", 8, { ...group, ordem: 2 })],
      atas: [],
      servidores: [],
      participacao: [],
      visitantes: [],
      trocas_chaveiro: [],
    } satisfies ContractRows;
    expect(validateContractIntegrity(rows)).toContainEqual({
      sheet: "grupos",
      rowNumber: 8,
      field: "grupo_id",
      message: "grupo_id duplicado.",
    });
  });

  it("rejeita ordem de grupo duplicada", () => {
    const rows = {
      grupos: [
        row("grupos", 2, group),
        row("grupos", 3, {
          ...group,
          grupo_id: "2bed9d1b-7fea-4cf4-9497-f0ccbcead41c",
        }),
      ],
      atas: [], servidores: [], participacao: [], visitantes: [], trocas_chaveiro: [],
    } satisfies ContractRows;
    expect(validateContractIntegrity(rows)).toEqual([
      expect.objectContaining({ sheet: "grupos", rowNumber: 3, field: "ordem" }),
    ]);
  });

  it("rejeita ordem de servidor repetida apenas na mesma ata", () => {
    const server = {
      servidor_id: "a4e54dd9-8e3f-4d56-a932-00ea5c13fc88",
      ata_id: "93ef9660-8c64-4b51-9bc5-09069ce629c1",
      nome: "Maria",
      ordem: 1,
      ...audit,
    } satisfies Servidor;
    const rows = {
      grupos: [], atas: [],
      servidores: [
        row("servidores", 2, server),
        row("servidores", 3, {
          ...server,
          servidor_id: "dbca5f07-744f-4e9f-9169-f7f66d4cbbcc",
        }),
      ],
      participacao: [], visitantes: [], trocas_chaveiro: [],
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
