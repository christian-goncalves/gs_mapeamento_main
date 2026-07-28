import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const officialV5Endpoint = "https://api.restcountries.com/countries/v5?response_fields=names.common,codes.alpha_2,codes.alpha_3&limit=500";
const legacyMirrorEndpoint = "https://restcountries.conventus.de/v3.1/all?fields=name,cca2,cca3,translations";
const targetPath = path.join(process.cwd(), "data", "paises.json");
const tmpPath = targetPath + ".tmp";

function normalizeName(value) {
  return String(value ?? "").trim();
}

function countryFromV5(item) {
  return {
    codigo: normalizeName(item?.codes?.alpha_2).toUpperCase(),
    codigo_iso3: normalizeName(item?.codes?.alpha_3).toUpperCase(),
    nome: normalizeName(item?.names?.common),
  };
}

function countryFromV31(item) {
  return {
    codigo: normalizeName(item?.cca2).toUpperCase(),
    codigo_iso3: normalizeName(item?.cca3).toUpperCase(),
    nome: normalizeName(item?.translations?.por?.common) || normalizeName(item?.name?.common),
  };
}

function normalizeCountries(items, mapper) {
  const seen = new Set();
  return items
    .map(mapper)
    .filter((item) => item.codigo && item.codigo_iso3 && item.nome)
    .filter((item) => {
      const key = item.codigo;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((first, second) => first.nome.localeCompare(second.nome, "pt-BR"));
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, { headers });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error("Fonte de países retornou HTTP " + response.status + ".");
  }
  return payload;
}

async function fetchCountries() {
  const apiKey = process.env.REST_COUNTRIES_API_KEY;
  if (apiKey) {
    const payload = await fetchJson(officialV5Endpoint, {
      Authorization: "Bearer " + apiKey,
    });
    if (!Array.isArray(payload)) {
      throw new Error("REST Countries v5 retornou payload inesperado.");
    }
    return normalizeCountries(payload, countryFromV5);
  }

  const payload = await fetchJson(legacyMirrorEndpoint);
  if (!Array.isArray(payload)) {
    throw new Error("Mirror REST Countries retornou payload inesperado.");
  }
  return normalizeCountries(payload, countryFromV31);
}

const countries = await fetchCountries();
if (countries.length < 190) {
  throw new Error("Lista de países incompleta: " + countries.length + ".");
}
await mkdir(path.dirname(targetPath), { recursive: true });
await writeFile(tmpPath, JSON.stringify({
  version: 1,
  updatedAt: new Date().toISOString(),
  countries,
}, null, 2) + "\n");
await rename(tmpPath, targetPath);
console.log("Cache de países atualizado: " + countries.length + " países.");
