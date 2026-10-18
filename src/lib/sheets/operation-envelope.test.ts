import { describe, expect, it } from "vitest";
import {
  createOperationEnvelope,
  deterministicOperationId,
  MAX_ATAS_PER_OPERATION,
  MAX_OPERATION_PAYLOAD_BYTES,
} from "./operation-envelope";

function envelope(overrides: Partial<Parameters<typeof createOperationEnvelope>[0]> = {}) {
  return createOperationEnvelope({
    operacaoId: "f3fdaebc-2631-4f25-93b5-e2f8fdc04ff3",
    tipo: "criar_atas",
    quantidadeAtas: 1,
    payload: { ata: "sintetica" },
    ...overrides,
  });
}

describe("envelope de operação de escrita", () => {
  it("produz hash idêntico quando a ordem das chaves JSON muda", () => {
    expect(envelope({ payload: { a: 1, b: { y: 2, x: 3 } } }).hash_solicitacao).toBe(
      envelope({ payload: { b: { x: 3, y: 2 }, a: 1 } }).hash_solicitacao,
    );
  });

  it("mantém o hash da intenção estável apesar de guards diferentes", () => {
    const intent = { grupo_id: "g1", data: "2026-10-16" };
    expect(
      envelope({ payload: { intent, guard: "antes" }, hashPayload: intent }).hash_solicitacao,
    ).toBe(
      envelope({ payload: { intent, guard: "depois" }, hashPayload: intent }).hash_solicitacao,
    );
  });

  it("deriva ID estável para a mesma chave lógica e distinto para outra chave", () => {
    expect(deterministicOperationId("criar_ata", "grupo:data:hora")).toBe(
      deterministicOperationId("criar_ata", "grupo:data:hora"),
    );
    expect(deterministicOperationId("criar_ata", "grupo:data:hora")).not.toBe(
      deterministicOperationId("criar_ata", "grupo:data:hora2"),
    );
  });

  it("aceita até 50 atas e recusa 51", () => {
    expect(
      envelope({ quantidadeAtas: MAX_ATAS_PER_OPERATION }).quantidade_atas,
    ).toBe(50);
    expect(() => envelope({ quantidadeAtas: MAX_ATAS_PER_OPERATION + 1 })).toThrow(
      "de 1 a 50 atas",
    );
  });

  it("mede bytes UTF-8 e aceita exatamente 1,5 MiB", () => {
    const payload = "a".repeat(MAX_OPERATION_PAYLOAD_BYTES - 2);
    expect(envelope({ payload }).payload_bytes).toBe(MAX_OPERATION_PAYLOAD_BYTES);
    expect(() => envelope({ payload: `${payload}a` })).toThrow(
      `excede o limite de ${MAX_OPERATION_PAYLOAD_BYTES} bytes`,
    );
  });

  it("recusa operação sem ID, tipo, contagem ou payload serializável", () => {
    expect(() => envelope({ operacaoId: " " })).toThrow("operacao_id obrigatório");
    expect(() => envelope({ tipo: " " })).toThrow("Tipo de operação obrigatório");
    expect(() => envelope({ quantidadeAtas: 0 })).toThrow("de 1 a 50 atas");
    expect(() => envelope({ payload: Number.POSITIVE_INFINITY })).toThrow(
      "número não serializável",
    );
  });
});
