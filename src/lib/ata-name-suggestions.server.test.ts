import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AtaSubmission } from "@/domain/form-schemas";

vi.mock("server-only", () => ({}));

import {
  getAtaNameSuggestionsByGroup,
  updateAtaNameSuggestionsFromSubmission,
} from "./ata-name-suggestions.server";

const groupId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
const otherGroupId = "54015b3b-aa07-4d53-bde4-7498c8d7c1b8";
const tempDirs: string[] = [];

function submission(overrides: Partial<AtaSubmission> = {}): AtaSubmission {
  return {
    ata: {
      grupo_id: groupId,
      data_reuniao: "2026-07-19",
      hora_inicio: "10:00",
      duracao: "",
      formato_outros: "",
      preenchido_por: "Patricia",
      plataforma: "zoom",
      tipo_reuniao: "fechada",
      formatos: ["partilha"],
      total_membros_presentes: 1,
      total_partilhas: 1,
    },
    servidores: [{ nome: "Hércules", funcao: "Coordenador" }],
    participacao: [],
    visitantes: [],
    ingressos: [],
    trocas_chaveiro: [],
    ...overrides,
  };
}

async function tempFile() {
  const dir = await mkdtemp(join(tmpdir(), "ata-suggestions-"));
  tempDirs.push(dir);
  return join(dir, "ata-name-suggestions.json");
}

describe("cache JSON de sugestões de nomes", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("retorna listas vazias quando o arquivo ainda não existe", async () => {
    const path = await tempFile();
    await expect(getAtaNameSuggestionsByGroup(groupId, path)).resolves.toMatchObject({
      preenchido_por: [],
      servidores: [],
    });
  });

  it("cria e atualiza o arquivo após submissões sem misturar grupos", async () => {
    const path = await tempFile();
    await updateAtaNameSuggestionsFromSubmission(submission(), path);
    await updateAtaNameSuggestionsFromSubmission(
      submission({
        ata: { ...submission().ata, grupo_id: otherGroupId, preenchido_por: "Ana" },
        servidores: [{ nome: "Hércules", funcao: "" }],
      }),
      path,
    );

    await expect(getAtaNameSuggestionsByGroup(groupId, path)).resolves.toMatchObject({
      preenchido_por: ["Patricia"],
      servidores: ["Hércules"],
    });
    await expect(getAtaNameSuggestionsByGroup(otherGroupId, path)).resolves.toMatchObject({
      preenchido_por: ["Ana"],
      servidores: ["Hércules"],
    });

    const document = JSON.parse(await readFile(path, "utf8")) as { version: number };
    expect(document.version).toBe(1);
  });
});
