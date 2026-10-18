import "server-only";

import { createHash, createHmac } from "node:crypto";
import {
  canonicalJson,
  createOperationEnvelope,
  type JsonValue,
} from "./operation-envelope";

export type SheetRangeGuard = {
  range: string;
  sha256: string;
};

export type GatewayPayload = {
  actor: string;
  intent: JsonValue;
  requests: JsonValue[];
  guards: SheetRangeGuard[];
  quantidade_atas: number;
};

export type GatewayOperationStatus = {
  state: "aplicada" | "nao_encontrada" | "conflito" | "indeterminada";
  safe_to_retry: false;
  resultado_ref?: string;
};

const GATEWAY_REQUEST_TIMEOUT_MS = 30_000;

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

export function hashSheetValues(values: JsonValue) {
  return createHash("sha256")
    .update(canonicalJson(values))
    .digest("hex");
}

export function createSheetRangeGuard(range: string, values: JsonValue): SheetRangeGuard {
  if (!/^[A-Za-z0-9_À-ÿ ]+![A-Z]+(?::[A-Z]+|\d+(?::[A-Z]+\d+)?)$/.test(range)) {
    throw new Error("Intervalo de leitura inválido para guard.");
  }
  return { range, sha256: hashSheetValues(values) };
}

async function postSignedValue<T extends JsonValue>(field: "operation" | "query", value: T) {
  const timestamp = Date.now();
  const signature = createHmac(
    "sha256",
    requiredEnvironment("SHEETS_GATEWAY_HMAC_SECRET"),
  )
    .update(`${timestamp}.${canonicalJson(value)}`)
    .digest("base64url");
  return fetch(requiredEnvironment("SHEETS_GATEWAY_URL"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ timestamp, [field]: value, signature }),
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(GATEWAY_REQUEST_TIMEOUT_MS),
  });
}

export async function queryGatewayOperationStatus(input: {
  operacaoId: string;
  hashSolicitacao: string;
}): Promise<GatewayOperationStatus> {
  const response = await postSignedValue("query", {
    operacao_id: input.operacaoId,
    hash_solicitacao: input.hashSolicitacao,
  });
  let result: { ok?: boolean; state?: GatewayOperationStatus["state"]; safe_to_retry?: false; resultado_ref?: string };
  try {
    result = await response.json();
  } catch {
    throw new Error(`Resposta inválida ao consultar o ledger da operação ${input.operacaoId}.`);
  }
  if (!response.ok || !result.ok || !result.state || result.safe_to_retry !== false) {
    throw new Error(`Não foi possível confirmar o estado da operação ${input.operacaoId}.`);
  }
  return {
    state: result.state,
    safe_to_retry: false,
    ...(result.resultado_ref ? { resultado_ref: result.resultado_ref } : {}),
  };
}

async function reconcileAfterUnknownResult(operation: {
  operacao_id: string;
  hash_solicitacao: string;
}) {
  try {
    return await queryGatewayOperationStatus({
      operacaoId: operation.operacao_id,
      hashSolicitacao: operation.hash_solicitacao,
    });
  } catch {
    return null;
  }
}

export async function executeGatewayOperation(input: {
  operacaoId: string;
  tipo: string;
  payload: GatewayPayload;
}) {
  if (!input.payload.actor.trim()) throw new Error("Ator da operação obrigatório.");
  if (typeof input.payload.intent === "undefined") throw new Error("Intenção idempotente obrigatória.");
  const operation = createOperationEnvelope({
    operacaoId: input.operacaoId,
    tipo: input.tipo,
    quantidadeAtas: input.payload.quantidade_atas,
    payload: input.payload,
    hashPayload: input.payload.intent,
  });
  let response: Response | undefined;
  let result: { ok?: boolean; code?: string; message?: string; existing?: boolean } | undefined;
  let indeterminate = false;
  try {
    response = await postSignedValue("operation", operation as unknown as JsonValue);
  } catch {
    indeterminate = true;
  }

  if (response) {
    try {
      result = await response.json();
      if (!response.ok || (result && !result.ok && result.code === "WRITE_RESULT_UNKNOWN")) {
        indeterminate = true;
      }
    } catch {
      indeterminate = true;
    }
  }

  if (!indeterminate && response && result?.ok) {
    return { operacao_id: operation.operacao_id, existing: result.existing ?? false };
  }
  if (!indeterminate && result && !result.ok) {
    throw new Error(result.message ?? `Gateway recusou a operação (${result.code ?? response?.status}).`);
  }

  const status = await reconcileAfterUnknownResult(operation);
  if (status?.state === "aplicada") {
    return { operacao_id: operation.operacao_id, existing: true, reconciled: true };
  }
  const state = status ? `estado no ledger: ${status.state}` : "ledger indisponível";
  throw new Error(
    `Resultado indeterminado para operação ${operation.operacao_id} (${state}); não repita automaticamente. A ausência no ledger não prova que uma solicitação ainda em trânsito foi encerrada.`,
  );
}
