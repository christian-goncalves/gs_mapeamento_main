import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AtaCompleta } from "@/domain/rules";
import type { AtaSubmission } from "@/domain/form-schemas";
import {
  buildAtaNameSuggestionsDocument,
  emptyAtaNameSuggestionsDocument,
  mergeAtaNameSuggestions,
  parseAtaNameSuggestionsDocument,
  type AtaNameSuggestionsDocument,
} from "@/domain/ata-name-suggestions";

export const ATA_NAME_SUGGESTIONS_PATH = join(
  process.cwd(),
  "data",
  "ata-name-suggestions.json",
);

async function readSuggestionsFile(path = ATA_NAME_SUGGESTIONS_PATH) {
  try {
    const raw = await readFile(path, "utf8");
    return parseAtaNameSuggestionsDocument(JSON.parse(raw));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return emptyAtaNameSuggestionsDocument();
    }
    throw error;
  }
}

async function writeSuggestionsFile(
  document: AtaNameSuggestionsDocument,
  path = ATA_NAME_SUGGESTIONS_PATH,
) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
}

export async function getAtaNameSuggestionsByGroup(
  grupoId: string,
  path = ATA_NAME_SUGGESTIONS_PATH,
) {
  const document = await readSuggestionsFile(path);
  return document.groups[grupoId] ?? {
    preenchido_por: [],
    servidores: [],
    updatedAt: document.updatedAt,
  };
}

export async function updateAtaNameSuggestionsFromSubmission(
  submission: AtaSubmission,
  path = ATA_NAME_SUGGESTIONS_PATH,
) {
  const current = await readSuggestionsFile(path);
  const next = mergeAtaNameSuggestions(current, {
    grupo_id: submission.ata.grupo_id,
    preenchido_por: submission.ata.preenchido_por,
    servidores: submission.servidores.map((servidor) => servidor.nome),
  });
  await writeSuggestionsFile(next, path);
  return next;
}

export async function rebuildAtaNameSuggestionsFromRecords(
  records: AtaCompleta[],
  path = ATA_NAME_SUGGESTIONS_PATH,
) {
  const document = buildAtaNameSuggestionsDocument(
    records.map((record) => ({
      grupo_id: record.ata.grupo_id,
      preenchido_por: record.ata.preenchido_por,
      servidores: record.servidores.map((servidor) => servidor.nome),
    })),
  );
  await writeSuggestionsFile(document, path);
  return document;
}
