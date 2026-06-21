import { readFileSync } from "node:fs";
import { join } from "node:path";

const rawMunicipios: unknown = JSON.parse(
  readFileSync(join(process.cwd(), "src/data/municipios-ibge.json"), "utf8"),
);

export type Municipio = { id: number; nome: string; uf: string };
export type MunicipioDocument = {
  source: string;
  updatedAt: string;
  municipios: Municipio[];
};

export function normalizeMunicipioSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim()
    .replace(/\s+/g, " ");
}

export function municipioOption(municipio: Municipio) {
  return `${municipio.nome} - ${municipio.uf}`;
}

export function validateMunicipioDocument(document: MunicipioDocument) {
  if (!document.source.startsWith("https://servicodados.ibge.gov.br/")) {
    throw new Error("Fonte da base de municípios inválida.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(document.updatedAt)) {
    throw new Error("Data de atualização da base de municípios inválida.");
  }

  const ids = new Set<number>();
  const ufs = new Set<string>();
  for (const [index, item] of document.municipios.entries()) {
    if (
      !Number.isInteger(item.id) ||
      item.id <= 0 ||
      !item.nome?.trim() ||
      !/^[A-Z]{2}$/.test(item.uf)
    ) {
      throw new Error(`Município inválido na posição ${index}.`);
    }
    if (ids.has(item.id)) throw new Error(`ID municipal duplicado: ${item.id}.`);
    ids.add(item.id);
    ufs.add(item.uf);

    const previous = document.municipios[index - 1];
    if (previous) {
      const comparison =
        previous.nome.localeCompare(item.nome, "pt-BR") ||
        previous.uf.localeCompare(item.uf) ||
        previous.id - item.id;
      if (comparison > 0) throw new Error("Base de municípios fora de ordem.");
    }
  }
  if (ufs.size !== 27) throw new Error(`Esperadas 27 UFs; recebidas ${ufs.size}.`);
  return document;
}

export const municipioDocument = validateMunicipioDocument(
  rawMunicipios as MunicipioDocument,
);

const municipioOptions = new Set(
  municipioDocument.municipios.map(municipioOption),
);

export function isMunicipioOption(value: string) {
  return municipioOptions.has(value);
}

export function searchMunicipios(query: string, limit = 20) {
  const normalized = normalizeMunicipioSearch(query);
  if (!normalized || limit <= 0) return [];
  return municipioDocument.municipios
    .filter((item) =>
      normalizeMunicipioSearch(`${item.nome} ${item.uf}`).includes(normalized),
    )
    .slice(0, limit)
    .map((item) => ({ ...item, label: municipioOption(item) }));
}
