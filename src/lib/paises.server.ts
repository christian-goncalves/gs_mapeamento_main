import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { normalizeCountries, type Pais, type PaisesCache } from "@/domain/paises";

const cachePath = path.join(process.cwd(), "data", "paises.json");

const paisSchema = z.object({
  codigo: z.string(),
  codigo_iso3: z.string(),
  nome: z.string(),
});

const cacheSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string().datetime({ offset: true }).nullable(),
  countries: z.array(paisSchema),
});

export async function readPaisesCache(): Promise<PaisesCache> {
  try {
    const raw = await readFile(cachePath, "utf8");
    const parsed = cacheSchema.parse(JSON.parse(raw));
    return {
      ...parsed,
      countries: normalizeCountries(parsed.countries) as Pais[],
    };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { version: 1, updatedAt: null, countries: [] };
    }
    throw error;
  }
}
