import { describe, expect, it } from "vitest";
import { SHEET_HEADERS } from "./contract";
import {
  ataStatuses,
  compatibleHeaders,
  groupPlatformRowsToObjects,
  rowsToVersionedObjects,
  sheetColumnName,
  sheetReadRange,
} from "./contract-v2";
import { rowsToObjects, type SheetCell } from "./rows";

describe("V2 Sheets contract compatibility", () => {
  it("keeps the existing contract as an exact prefix and appends approved fields", () => {
    expect(compatibleHeaders("atas").slice(0, SHEET_HEADERS.atas.length)).toEqual(
      SHEET_HEADERS.atas,
    );
    expect(compatibleHeaders("atas").slice(SHEET_HEADERS.atas.length)).toEqual([
      "status_registro",
      "status_aprovacao",
      "revisao_de_ata_id",
      "motivo_alteracao",
      "alterado_por",
      "alterado_em",
      "excluida_em",
      "aprovado_por",
      "aprovado_em",
      "formato_comemorativa",
      "formato_servico",
    ]);
  });

  it("reads known V2 trailing columns without weakening default header validation", () => {
    const headers = [...compatibleHeaders("atas")];
    const values: SheetCell[][] = [
      headers,
      [...SHEET_HEADERS.atas.map(() => "legacy"), "ativa"],
    ];
    expect(() => rowsToObjects(SHEET_HEADERS.atas, values)).toThrow("Cabeçalho inválido");
    expect(
      rowsToObjects(SHEET_HEADERS.atas, values, {
        allowExtraTrailingHeaders: headers.slice(SHEET_HEADERS.atas.length),
      }),
    ).toHaveLength(1);
  });

  it("derives read widths beyond column Z from the selected contract", () => {
    expect(sheetColumnName(25)).toBe("Z");
    expect(sheetColumnName(26)).toBe("AA");
    expect(sheetColumnName(51)).toBe("AZ");
    expect(sheetReadRange("atas")).toBe("atas!A:AF");
  });

  it("defaults legacy ata lifecycle fields and rejects unknown values", () => {
    expect(ataStatuses({})).toEqual({
      status_registro: "ativa",
      status_aprovacao: "aprovada",
    });
    expect(
      ataStatuses({ status_registro: "substituida", status_aprovacao: "pendente_revisao" }),
    ).toEqual({
      status_registro: "substituida",
      status_aprovacao: "pendente_revisao",
    });
    expect(() => ataStatuses({ status_registro: "unknown" })).toThrow(
      "Estado V2 da ata inválido",
    );
  });

  it("adapts both V1 and V2 rows and preserves V2 fields", () => {
    const legacy = rowsToVersionedObjects("atas", [
      [...SHEET_HEADERS.atas],
      SHEET_HEADERS.atas.map(() => "legacy"),
    ]);
    expect(legacy[0].value.status_registro).toBe("ativa");
    expect(legacy[0].value.status_aprovacao).toBe("aprovada");

    const headers = [...compatibleHeaders("atas")];
    const current = rowsToVersionedObjects("atas", [
      [...headers],
      [...SHEET_HEADERS.atas.map(() => "current"), "substituida", "pendente_revisao"],
    ]);
    expect(current[0].value.status_registro).toBe("substituida");
    expect(current[0].value.status_aprovacao).toBe("pendente_revisao");
    expect(current[0].value.revisao_de_ata_id).toBe("");
  });

  it("keeps legacy group schedules readable with an empty pending platform association", () => {
    const v1 = rowsToVersionedObjects("grupo_horarios", [
      [...SHEET_HEADERS.grupo_horarios],
      ["33333333-3333-4333-8333-333333333333", "11111111-1111-4111-8111-111111111111", "segunda", "20:00", "", true, "2026-10-01T00:00:00.000Z", "2026-10-01T00:00:00.000Z"],
    ]);
    expect(v1[0].value.plataforma_id).toBe("");
  });

  it("parses the isolated platform catalog contract", () => {
    const headers = ["plataforma_id", "grupo_id", "tipo", "link", "id_acesso", "senha_pin", "ativo", "created_at", "updated_at"];
    expect(groupPlatformRowsToObjects([headers, ["p", "g", "zoom", "https://example.org", "", "", true, "now", "now"]])).toHaveLength(1);
  });

  it("normalizes historical visitor header aliases", () => {
    const headers = [...SHEET_HEADERS.visitantes].map((header) => {
      if (header === "descricao") return "categoria";
      if (header === "como_chegou_a_na") return "origem_contato";
      return header;
    });
    const row = SHEET_HEADERS.visitantes.map((header) => `v:${header}`);
    const parsed = rowsToVersionedObjects("visitantes", [headers, row]);
    expect(parsed[0].value.descricao).toBe("v:descricao");
    expect(parsed[0].value.como_chegou_a_na).toBe("v:como_chegou_a_na");
  });
});
