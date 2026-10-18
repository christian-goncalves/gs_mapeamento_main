import { createHash } from "node:crypto";

export const MAX_ATAS_PER_OPERATION = 50;
export const MAX_OPERATION_PAYLOAD_BYTES = 1.5 * 1024 * 1024;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type OperationEnvelope<T extends JsonValue = JsonValue> = {
  operacao_id: string;
  tipo: string;
  hash_solicitacao: string;
  quantidade_atas: number;
  payload_bytes: number;
  payload: T;
};

function stableValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("Payload contém número não serializável.");
  }
  return value;
}

export function canonicalJson(value: JsonValue) {
  return JSON.stringify(stableValue(value));
}

export function deterministicOperationId(namespace: string, key: string) {
  if (!namespace.trim() || !key.trim()) throw new Error("Chave idempotente obrigatória.");
  const bytes = createHash("sha256").update(`${namespace}\0${key}`).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createOperationEnvelope<T extends JsonValue>(input: {
  operacaoId: string;
  tipo: string;
  quantidadeAtas: number;
  payload: T;
  hashPayload?: JsonValue;
}): OperationEnvelope<T> {
  const operationId = input.operacaoId.trim();
  if (!operationId) throw new Error("operacao_id obrigatório.");
  if (!input.tipo.trim()) throw new Error("Tipo de operação obrigatório.");
  if (
    !Number.isInteger(input.quantidadeAtas) ||
    input.quantidadeAtas < 1 ||
    input.quantidadeAtas > MAX_ATAS_PER_OPERATION
  ) {
    throw new Error(`Operação deve conter de 1 a ${MAX_ATAS_PER_OPERATION} atas.`);
  }

  const serialized = canonicalJson(input.payload);
  const hashSerialized = canonicalJson(input.hashPayload ?? input.payload);
  const payloadBytes = Buffer.byteLength(serialized, "utf8");
  if (payloadBytes > MAX_OPERATION_PAYLOAD_BYTES) {
    throw new Error(
      `Payload excede o limite de ${MAX_OPERATION_PAYLOAD_BYTES} bytes.`,
    );
  }

  return {
    operacao_id: operationId,
    tipo: input.tipo.trim(),
    hash_solicitacao: createHash("sha256").update(hashSerialized).digest("hex"),
    quantidade_atas: input.quantidadeAtas,
    payload_bytes: payloadBytes,
    payload: input.payload,
  };
}
