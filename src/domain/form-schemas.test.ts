import { describe, expect, it } from "vitest";
import {
  ataFormSchema,
  ataSubmissionSchema,
  grupoFormSchema,
  ingressoFormSchema,
  participacaoFormSchema,
  trocaChaveiroFormSchema,
  visitanteFormSchema,
} from "./form-schemas";

describe("schemas de formulário", () => {
  it("valida todos os campos obrigatórios do grupo", () => {
    expect(
      grupoFormSchema.safeParse({
        acesso_plataforma: "123456789",
        plataforma: "zoom",
        fuso_horario: "America/Sao_Paulo",
        grupo_nome: "Grupo",
        ativo: true,
        email_acesso_grupo: "grupo@example.com",
        ultima_reuniao_anterior: 12,
      }).success,
    ).toBe(true);
    expect(
      grupoFormSchema.safeParse({
        acesso_plataforma: "",
        plataforma: "zoom",
        fuso_horario: "America/Sao_Paulo",
        grupo_nome: "Grupo",
        ativo: true,
        responsavel_grupo_nome: "",
        responsavel_grupo_email: "email-invalido",
        email_acesso_grupo: "",
        ultima_reuniao_anterior: -1,
      }).success,
    ).toBe(false);
  });

  it("aceita códigos internos sem campos de persistência", () => {
    expect(
      ataFormSchema.safeParse({
        grupo_id: "fccced1d-92a5-4d24-b5af-da65cbbe467f",
        data_reuniao: "2026-06-21",
        hora_inicio: "20:30",
        duracao: "1:30",
        formato_outros: "",
        preenchido_por: "Patricia",
        plataforma: "zoom",
        tipo_reuniao: "fechada",
        formatos: ["estudo"],
        total_membros_presentes: 1,
        total_partilhas: 1,
      }).success,
    ).toBe(true);
  });

  it("aplica a regra de estado também na entrada", () => {
    expect(
      participacaoFormSchema.safeParse({
        localidade: "Lisboa",
        estado: "LX",
        pais: "Portugal",
        presencas: 1,
      }).success,
    ).toBe(false);
  });

  it("aceita localidade vazia somente fora do Brasil", () => {
    expect(
      participacaoFormSchema.safeParse({
        localidade: "",
        estado: "",
        pais: "Portugal",
        presencas: 1,
      }).success,
    ).toBe(true);
    expect(
      participacaoFormSchema.safeParse({
        localidade: "",
        estado: "BA",
        pais: "Brasil",
        presencas: 1,
      }).success,
    ).toBe(false);
  });

  it("exige descrição quando formato outros é selecionado", () => {
    expect(
      ataFormSchema.safeParse({
        grupo_id: "fccced1d-92a5-4d24-b5af-da65cbbe467f",
        data_reuniao: "2026-06-21",
        hora_inicio: "20:30",
        duracao: "",
        formato_outros: "",
        preenchido_por: "Patricia",
        plataforma: "zoom",
        tipo_reuniao: "fechada",
        formatos: ["outros"],
        total_membros_presentes: 1,
        total_partilhas: 1,
      }).success,
    ).toBe(false);
  });

  it("valida visitante com a mesma base municipal do runtime", () => {
    expect(
      visitanteFormSchema.safeParse({
        cidade: "Inexistente - SP",
        descricao: "outro",
        como_chegou_a_na: "outro",
      }).success,
    ).toBe(false);
  });

  it("valida ingresso e troca de chaveiro full", () => {
    expect(ingressoFormSchema.safeParse({ cidade: "Itajaí - SC" }).success).toBe(true);
    expect(ingressoFormSchema.safeParse({ cidade: "" }).success).toBe(false);
    expect(trocaChaveiroFormSchema.safeParse({ tempo_limpo: "dias_30", quantidade: 1 }).success).toBe(true);
    expect(trocaChaveiroFormSchema.safeParse({ tempo_limpo: "valor_invalido", quantidade: 1 }).success).toBe(false);
    expect(trocaChaveiroFormSchema.safeParse({ tempo_limpo: "dias_30", quantidade: 0 }).success).toBe(false);
  });

  it("rejeita ingressos quando não há visitante", () => {
    const result = ataSubmissionSchema.safeParse({
      ata: {
        grupo_id: "fccced1d-92a5-4d24-b5af-da65cbbe467f",
        data_reuniao: "2026-06-22",
        hora_inicio: "20:30",
        duracao: "",
        formato_outros: "",
        preenchido_por: "Patricia",
        plataforma: "zoom",
        tipo_reuniao: "aberta",
        formatos: ["partilha"],
        total_membros_presentes: 1,
        total_partilhas: 1,
      },
      servidores: [],
      participacao: [],
      visitantes: [],
      ingressos: [{ cidade: "Itajaí - SC" }],
      trocas_chaveiro: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Para registrar um ingresso, registre primeiro pelo menos um visitante.",
      );
    }
  });

  it("limita o ingresso às cidades dos visitantes", () => {
    const base = {
      ata: {
        grupo_id: "fccced1d-92a5-4d24-b5af-da65cbbe467f",
        data_reuniao: "2026-06-22",
        hora_inicio: "20:30",
        duracao: "",
        formato_outros: "",
        preenchido_por: "Patricia",
        plataforma: "zoom" as const,
        tipo_reuniao: "aberta" as const,
        formatos: ["partilha" as const],
        total_membros_presentes: 1,
        total_partilhas: 1,
      },
      servidores: [],
      participacao: [],
      visitantes: [{ cidade: "Itajaí - SC", descricao: "outro" as const, como_chegou_a_na: "outro" as const }],
      ingressos: [{ cidade: "Itajaí - SC" }],
      trocas_chaveiro: [],
    };
    expect(ataSubmissionSchema.safeParse(base).success).toBe(true);
    expect(
      ataSubmissionSchema.safeParse({
        ...base,
        visitantes: [...base.visitantes, { cidade: "Itajaí - SC", descricao: "familiar", como_chegou_a_na: "familiar" }],
        ingressos: [{ cidade: "Itajaí - SC" }, { cidade: "Itajaí - SC" }],
      }).success,
    ).toBe(true);
    const invalid = ataSubmissionSchema.safeParse({ ...base, ingressos: [{ cidade: "Joinville - SC" }] });
    expect(invalid.success).toBe(false);
    if (!invalid.success) expect(invalid.error.issues[0]?.message).toContain("cidades dos visitantes");
  });

  it("aceita envio completo com listas vazias", () => {
    expect(
      ataSubmissionSchema.safeParse({
        ata: {
          grupo_id: "fccced1d-92a5-4d24-b5af-da65cbbe467f",
          data_reuniao: "2026-06-22",
          hora_inicio: "20:30",
          duracao: "",
          formato_outros: "",
          preenchido_por: "Patricia",
          plataforma: "zoom",
          tipo_reuniao: "aberta",
          formatos: ["partilha"],
          total_membros_presentes: 1,
          total_partilhas: 1,
        },
        servidores: [],
        participacao: [],
        visitantes: [],
        ingressos: [],
        trocas_chaveiro: [],
      }).success,
    ).toBe(true);
  });
});
