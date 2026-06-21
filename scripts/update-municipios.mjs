import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE =
  "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome";
const output = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/data/municipios-ibge.json",
);

function ufOf(item) {
  return (
    item.microrregiao?.mesorregiao?.UF?.sigla ??
    item["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla
  );
}

const response = await fetch(SOURCE);
if (!response.ok) {
  throw new Error(`IBGE respondeu ${response.status} ${response.statusText}.`);
}

const payload = await response.json();
const municipios = payload
  .map((item) => ({ id: item.id, nome: item.nome, uf: ufOf(item) }))
  .sort(
    (first, second) =>
      first.nome.localeCompare(second.nome, "pt-BR") ||
      first.uf.localeCompare(second.uf) ||
      first.id - second.id,
  );

if (
  municipios.some(
    (item) =>
      !Number.isInteger(item.id) ||
      item.id <= 0 ||
      typeof item.nome !== "string" ||
      !item.nome.trim() ||
      !/^[A-Z]{2}$/.test(item.uf),
  )
) {
  throw new Error("A resposta do IBGE contém campos obrigatórios inválidos.");
}

if (new Set(municipios.map((item) => item.id)).size !== municipios.length) {
  throw new Error("A resposta do IBGE contém IDs duplicados.");
}

const ufs = new Set(municipios.map((item) => item.uf));
if (ufs.size !== 27) {
  throw new Error(`Esperadas 27 UFs; recebidas ${ufs.size}.`);
}

const document = {
  source: SOURCE,
  updatedAt: new Date().toISOString().slice(0, 10),
  municipios,
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(document, null, 2)}\n`, "utf8");
console.log(`Gerados ${municipios.length} municípios de ${ufs.size} UFs.`);
