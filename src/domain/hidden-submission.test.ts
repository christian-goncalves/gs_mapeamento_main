import { describe, expect, it } from "vitest";
import {
  hiddenAtaSubmissionSchema,
  normalizeHiddenAtaSubmission,
} from "./hidden-submission";
import { ataCompletaSchema, calcularIndicadores } from "./rules";

const grupoId = "fccced1d-92a5-4d24-b5af-da65cbbe467f";

function hiddenPayload() {
  return {
    ata: {
      grupo_id: grupoId,
      data_reuniao: "2026-06-23",
      hora_inicio: "20:30",
      plataforma: "zoom",
      tipo_reuniao: "aberta",
      formatos: ["partilha"],
      total_membros_presentes: 20,
      total_partilhas: 6,
    },
    servidores: [],
    participacao: [
      { localidade: "Itajaí - SC", presencas: 8 },
      { localidade: "Brusque - SC", presencas: 4 },
      { localidade: "Joinville - SC", presencas: 3 },
    ],
    visitantes: [
      { anonimo: true, nome: "", cidade: "Itajaí - SC" },
      { anonimo: false, nome: "Visitante", cidade: "Brusque - SC" },
    ],
    ingressos: [
      { anonimo: true, nome: "" },
      { anonimo: false, nome: "Ingressante" },
    ],
    trocas_chaveiro: [{ tempo_limpo: "1M", quantidade: 2 }],
  } as const;
}

describe("normalização do formulário hidden", () => {
  it("deriva contrato full e preserva Anonimo no backend", () => {
    const parsed = hiddenAtaSubmissionSchema.parse(hiddenPayload());
    const normalized = normalizeHiddenAtaSubmission(parsed);
    expect(normalized).toMatchObject({
      ata: { total_partilhas: 6 },
      participacao: [
        { localidade: "Itajaí", estado: "SC", pais: "Brasil", presencas: 8 },
        { localidade: "Brusque", estado: "SC", pais: "Brasil", presencas: 4 },
        { localidade: "Joinville", estado: "SC", pais: "Brasil", presencas: 3 },
      ],
      visitantes: [
        { nome: "Anonimo", categoria: "outro", origem_contato: "outro" },
        { nome: "Visitante", categoria: "outro", origem_contato: "outro" },
      ],
      ingressos: [{ nome: "Anonimo" }, { nome: "Ingressante" }],
      trocas_chaveiro: [{ tempo_limpo: "1M", quantidade: 2 }],
    });
  });

  it("calcula membros sem localidade do caso real", () => {
    const normalized = normalizeHiddenAtaSubmission(
      hiddenAtaSubmissionSchema.parse(hiddenPayload()),
    );
    const registro = ataCompletaSchema.parse({
      ata: {
        ata_id: "93ef9660-8c64-4b51-9bc5-09069ce629c1",
        ...normalized.ata,
        created_at: "2026-06-23T12:00:00.000Z",
        updated_at: "2026-06-23T12:00:00.000Z",
      },
      servidores: [],
      participacao: normalized.participacao.map((item, index) => ({
        participacao_id: [
          "e7918765-a98d-46bf-86f8-e6deef3190a2",
          "2bed9d1b-7fea-4cf4-9497-f0ccbcead41c",
          "dbca5f07-744f-4e9f-9169-f7f66d4cbbcc",
        ][index],
        ata_id: "93ef9660-8c64-4b51-9bc5-09069ce629c1",
        ...item,
        created_at: "2026-06-23T12:00:00.000Z",
        updated_at: "2026-06-23T12:00:00.000Z",
      })),
      visitantes: [],
      ingressos: [],
      trocas_chaveiro: [],
    });
    expect(calcularIndicadores(registro).membros_sem_localidade).toBe(5);
  });

  it("rejeita nome ausente quando anonimato está desligado", () => {
    const payload = hiddenPayload();
    const result = hiddenAtaSubmissionSchema.safeParse({
      ...payload,
      ingressos: [{ anonimo: false, nome: "" }],
    });
    expect(result.success).toBe(false);
  });
});
