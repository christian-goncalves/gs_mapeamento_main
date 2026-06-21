import { describe, expect, it, vi } from "vitest";
import {
  isMunicipioOption,
  municipioDocument,
  searchMunicipios,
  validateMunicipioDocument,
} from "./municipios";

describe("base local de municípios", () => {
  it("possui IDs únicos, campos obrigatórios e 27 UFs", () => {
    expect(validateMunicipioDocument(municipioDocument)).toBe(municipioDocument);
    expect(new Set(municipioDocument.municipios.map((item) => item.id)).size).toBe(
      municipioDocument.municipios.length,
    );
    expect(new Set(municipioDocument.municipios.map((item) => item.uf)).size).toBe(27);
  });

  it("busca por nome normalizado e UF sem chamada externa", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(searchMunicipios("sao paulo sp", 1)).toEqual([
      expect.objectContaining({ label: "São Paulo - SP" }),
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("rejeita município fora da base", () => {
    expect(isMunicipioOption("Inexistente - SP")).toBe(false);
    expect(isMunicipioOption("São Paulo - SP")).toBe(true);
  });
});
