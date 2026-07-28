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
      duracao: "1:30",
      formato_outros: "",
      preenchido_por: "Patricia",
      plataforma: "zoom",
      tipo_reuniao: "aberta",
      formatos: ["partilha"],
      total_membros_presentes: 20,
      total_partilhas: 6,
    },
    servidores: [{ nome: "Servidor", funcao: "Coordenação" }],
    participacao: [
      { localidade: "Itajaí - SC", presencas: 8 },
      { localidade: "Brusque - SC", presencas: 4 },
      { localidade: "Joinville - SC", presencas: 3 },
    ],
    visitantes: [
      { cidade: "Itajaí - SC", descricao: "outro", como_chegou_a_na: "outro" },
      { cidade: "Brusque - SC", descricao: "provavel_adicto", como_chegou_a_na: "internet" },
    ],
    ingressos: [
      { nome: "", cidade: "Itajaí - SC" },
      { nome: "Ingressante", cidade: "Joinville - SC" },
    ],
    trocas_chaveiro: [{ tempo_limpo: "dias_30", quantidade: 2 }],
  } as const;
}

describe("normalização do formulário hidden", () => {
  it("deriva o contrato full sem nome de visitante no payload", () => {
    const parsed = hiddenAtaSubmissionSchema.parse(hiddenPayload());
    const normalized = normalizeHiddenAtaSubmission(parsed);
    expect(normalized).toMatchObject({
      ata: { total_partilhas: 6 },
      servidores: [{ nome: "Servidor", funcao: "Coordenação" }],
      participacao: [
        { localidade: "Itajaí", estado: "SC", pais: "Brasil", presencas: 8 },
        { localidade: "Brusque", estado: "SC", pais: "Brasil", presencas: 4 },
        { localidade: "Joinville", estado: "SC", pais: "Brasil", presencas: 3 },
      ],
      visitantes: [
        { cidade: "Itajaí - SC", descricao: "outro", como_chegou_a_na: "outro" },
        { cidade: "Brusque - SC", descricao: "provavel_adicto", como_chegou_a_na: "internet" },
      ],
      ingressos: [
        { nome: "Anonimo", cidade: "Itajaí - SC" },
        { nome: "Ingressante", cidade: "Joinville - SC" },
      ],
      trocas_chaveiro: [{ tempo_limpo: "dias_30", quantidade: 2 }],
    });
  });

  it("calcula membros sem localidade do caso real", () => {
    const normalized = normalizeHiddenAtaSubmission(
      hiddenAtaSubmissionSchema.parse(hiddenPayload()),
    );
    const registro = ataCompletaSchema.parse({
      ata: {
        ata_id: "93ef9660-8c64-4b51-9bc5-09069ce629c1",
        numero_sequencial_grupo: 1,
        indice_personalizado_grupo: 1,
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

  it("normaliza membro internacional com localidade vazia", () => {
    const payload = hiddenPayload();
    const parsed = hiddenAtaSubmissionSchema.parse({
      ...payload,
      membros_internacionais: [{ pais: "Portugal", presencas: 2 }],
    });

    expect(normalizeHiddenAtaSubmission(parsed).participacao.at(-1)).toEqual({
      localidade: "",
      estado: "",
      pais: "Portugal",
      presencas: 2,
    });
  });

  it("exige cidade dos ingressos", () => {
    const payload = hiddenPayload();
    const result = hiddenAtaSubmissionSchema.safeParse({
      ...payload,
      ingressos: [{ nome: "", cidade: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejeita ingresso hidden quando não há visitante", () => {
    const payload = hiddenPayload();
    const result = hiddenAtaSubmissionSchema.safeParse({
      ...payload,
      visitantes: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Para registrar um ingresso, registre primeiro pelo menos um visitante.",
      );
    }
  });

  it("mantem limites numericos do payload hidden", () => {
    const payload = hiddenPayload();
    expect(
      hiddenAtaSubmissionSchema.safeParse({
        ...payload,
        ata: { ...payload.ata, total_membros_presentes: 0 },
      }).success,
    ).toBe(false);
    expect(
      hiddenAtaSubmissionSchema.safeParse({
        ...payload,
        ata: { ...payload.ata, total_partilhas: 0 },
      }).success,
    ).toBe(false);
    expect(
      hiddenAtaSubmissionSchema.safeParse({
        ...payload,
        participacao: [{ localidade: "Itajaí - SC", presencas: 0 }],
      }).success,
    ).toBe(false);
    expect(
      hiddenAtaSubmissionSchema.safeParse({
        ...payload,
        trocas_chaveiro: [{ tempo_limpo: "dias_30", quantidade: 0 }],
      }).success,
    ).toBe(false);
  });
});
