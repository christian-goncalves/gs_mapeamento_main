import { describe, expect, it } from "vitest";
import type { AdminAtaRow } from "./admin-atas-data";
import {
  DEFAULT_ADMIN_ATA_STATUS_FILTER,
  toAdminAtaDataTableRows,
} from "./admin-atas-table";

describe("admin atas table", () => {
  it("mantém o status nos dados visuais e leva os dados completos para ações", () => {
    const ata: AdminAtaRow = {
      ataId: "ata-1",
      indicePersonalizadoGrupo: 12,
      data: "2026-07-31",
      horario: "09:00",
      grupoId: "grupo-1",
      grupo: "USL",
      preenchidoPor: "Fábio",
      status: "Enviada",
    };

    const [row] = toAdminAtaDataTableRows([ata]);

    expect(row).toHaveLength(6);
    expect(row.slice(0, 4)).toEqual(["#12", "2026-07-31", "09:00", "USL"]);
    expect(row[4]).toBe("Enviada");
    expect(row[5]).toBe(ata);
  });

  it("inicia sem filtrar as atas por status", () => {
    expect(DEFAULT_ADMIN_ATA_STATUS_FILTER).toBe("todos");
  });
});
