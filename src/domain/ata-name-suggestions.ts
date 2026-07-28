import { z } from "zod";

export type AtaNameSuggestionGroup = {
  preenchido_por: string[];
  servidores: string[];
  updatedAt: string;
};

export type AtaNameSuggestionsDocument = {
  version: 1;
  updatedAt: string;
  groups: Record<string, AtaNameSuggestionGroup>;
};

export type AtaNameSuggestionInput = {
  grupo_id: string;
  preenchido_por?: string | null;
  servidores?: (string | null | undefined)[];
};

export const emptyAtaNameSuggestionsDocument =
  (): AtaNameSuggestionsDocument => ({
    version: 1,
    updatedAt: new Date(0).toISOString(),
    groups: {},
  });

const suggestionGroupSchema = z.object({
  preenchido_por: z.array(z.string()),
  servidores: z.array(z.string()),
  updatedAt: z.string().datetime({ offset: true }),
});

export const ataNameSuggestionsDocumentSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string().datetime({ offset: true }),
  groups: z.record(z.string().uuid(), suggestionGroupSchema),
});

export function normalizeAtaNameSuggestion(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function suggestionKey(value: string) {
  return normalizeAtaNameSuggestion(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function uniqueSortedAtaNameSuggestions(values: (string | null | undefined)[]) {
  const byKey = new Map<string, string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const normalized = normalizeAtaNameSuggestion(value);
    if (!normalized) continue;
    const key = suggestionKey(normalized);
    if (!byKey.has(key)) byKey.set(key, normalized);
  }
  return [...byKey.values()].sort((first, second) =>
    first.localeCompare(second, "pt-BR", { sensitivity: "base" }),
  );
}

function mergeGroupSuggestions(
  current: AtaNameSuggestionGroup | undefined,
  input: AtaNameSuggestionInput,
  now: string,
): AtaNameSuggestionGroup {
  return {
    preenchido_por: uniqueSortedAtaNameSuggestions([
      ...(current?.preenchido_por ?? []),
      input.preenchido_por,
    ]),
    servidores: uniqueSortedAtaNameSuggestions([
      ...(current?.servidores ?? []),
      ...(input.servidores ?? []),
    ]),
    updatedAt: now,
  };
}

export function mergeAtaNameSuggestions(
  document: AtaNameSuggestionsDocument,
  input: AtaNameSuggestionInput,
  now = new Date().toISOString(),
): AtaNameSuggestionsDocument {
  const current = document.groups[input.grupo_id];
  return {
    version: 1,
    updatedAt: now,
    groups: {
      ...document.groups,
      [input.grupo_id]: mergeGroupSuggestions(current, input, now),
    },
  };
}

export function buildAtaNameSuggestionsDocument(
  inputs: AtaNameSuggestionInput[],
  now = new Date().toISOString(),
): AtaNameSuggestionsDocument {
  return inputs.reduce(
    (document, input) => mergeAtaNameSuggestions(document, input, now),
    { version: 1, updatedAt: now, groups: {} } satisfies AtaNameSuggestionsDocument,
  );
}

export function parseAtaNameSuggestionsDocument(
  value: unknown,
): AtaNameSuggestionsDocument {
  return ataNameSuggestionsDocumentSchema.parse(value);
}
