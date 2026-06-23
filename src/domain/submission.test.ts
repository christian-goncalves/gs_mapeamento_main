import { describe, expect, it } from "vitest";
import { ataSubmissionSchema, type AtaSubmission } from "./form-schemas";
import { assertCreationAllowed, DuplicateAtaError } from "./creation";
import { materializeAtaSubmission } from "./submission";
import type { Grupo } from "./schemas";

const grupoId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
const submission = {
  ata: {
    grupo_id: grupoId,
    data_reuniao: "2026-06-22",
    hora_inicio: "20:30",
    plataforma: "zoom",
    tipo_reuniao: "aberta",
    formatos: ["partilha"],
    total_membros_presentes: 3,
    total_partilhas: 1,
  },
  servidores: [{ nome: "Primeiro" }, { nome: "Segundo" }],
  participacao: [
    {
      localidade: "Salvador",
      estado: "BA",
      pais: "Brasil",
      presencas: 2,
    },
  ],
  visitantes: [
    {
      nome: "Visitante",
      cidade: "São Paulo - SP",
      categoria: "outro",
      origem_contato: "internet",
    },
  ],
  ingressos: [{ nome: "Anonimo" }],
  trocas_chaveiro: [{ tempo_limpo: "1M", quantidade: 2 }],
} satisfies AtaSubmission;
const group = {
  grupo_id: grupoId,
  zoom_id: "001",
  grupo_nome: "Grupo",
  ordem: 1,
  ativo: true,
  created_at: "2026-06-21T12:00:00.000Z",
  updated_at: "2026-06-21T12:00:00.000Z",
} satisfies Grupo;

describe("envio imutável", () => {
  it("rejeita soma de participação acima do total", () => {
    const result = ataSubmissionSchema.safeParse({
      ...submission,
      participacao: [{ ...submission.participacao[0], presencas: 4 }],
    });
    expect(result.success).toBe(false);
  });

  it("exige grupo existente e ativo", () => {
    expect(() => assertCreationAllowed(submission, [], [])).toThrow(
      "Grupo inexistente",
    );
    expect(() =>
      assertCreationAllowed(submission, [{ ...group, ativo: false }], []),
    ).toThrow("Grupo inativo");
  });

  it("rejeita a chave de negócio repetida", () => {
    expect(() =>
      assertCreationAllowed(submission, [group], [submission.ata]),
    ).toThrow(DuplicateAtaError);
  });

  it("gera IDs, timestamp único e ordem pela posição do rascunho", () => {
    let id = 0;
    const registro = materializeAtaSubmission(submission, {
      now: () => "2026-06-22T12:00:00.000Z",
      uuid: () => `00000000-0000-4000-8000-${String(++id).padStart(12, "0")}`,
    });
    expect(registro.ata.ata_id).toBe("00000000-0000-4000-8000-000000000001");
    expect(registro.servidores.map((item) => item.ordem)).toEqual([1, 2]);
    expect(registro.servidores[0]).toMatchObject({
      ata_id: registro.ata.ata_id,
      created_at: "2026-06-22T12:00:00.000Z",
      updated_at: "2026-06-22T12:00:00.000Z",
    });
    expect(registro.ingressos[0]).toMatchObject({
      ata_id: registro.ata.ata_id,
      nome: "Anonimo",
    });
    expect(registro.trocas_chaveiro[0]).toMatchObject({
      tempo_limpo: "1M",
      quantidade: 2,
    });
  });
});
