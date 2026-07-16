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
        zoom_id: "123456789",
        grupo_nome: "Grupo",
        ativo: true,
        responsavel_grupo_nome: "Patricia",
        responsavel_grupo_email: "patricia@example.com",
        email_acesso_grupo: "grupo@example.com",
        ultima_reuniao_anterior: 12,
      }).success,
    ).toBe(true);
    expect(
      grupoFormSchema.safeParse({
        zoom_id: "TESTE ID",
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
        nome: "Pessoa",
        cidade: "Inexistente - SP",
        categoria: "outro",
        origem_contato: "outro",
      }).success,
    ).toBe(false);
  });

  it("valida ingresso e troca de chaveiro full", () => {
    expect(ingressoFormSchema.safeParse({ nome: "Anonimo", cidade: "Itajaí - SC" }).success).toBe(true);
    expect(ingressoFormSchema.safeParse({ nome: "Anonimo", cidade: "" }).success).toBe(false);
    expect(trocaChaveiroFormSchema.safeParse({ tempo_limpo: "1M", quantidade: 1 }).success).toBe(true);
    expect(trocaChaveiroFormSchema.safeParse({ tempo_limpo: "dias_30", quantidade: 1 }).success).toBe(false);
    expect(trocaChaveiroFormSchema.safeParse({ tempo_limpo: "1M", quantidade: 0 }).success).toBe(false);
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
