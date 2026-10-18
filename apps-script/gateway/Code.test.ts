import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const SECRET = "local-only-synthetic-secret";
const SPREADSHEET_ID = "local-only-spreadsheet";
const OPERATION_ID = "f3fdaebc-2631-4f25-93b5-e2f8fdc04ff3";
const LEDGER_HEADERS = [
  "operacao_id",
  "hash_solicitacao",
  "tipo",
  "ator",
  "estado",
  "criada_em",
  "concluida_em",
  "resultado_ref",
];
const GROUP_HEADERS = [
  "grupo_id", "zoom_id", "grupo_nome", "ordem", "ativo", "responsavel_grupo_nome",
  "responsavel_grupo_email", "email_acesso_grupo", "responsaveis_ata", "link_formulario_ata",
  "ultima_reuniao_anterior", "created_at", "updated_at", "fuso_horario", "plataforma", "acesso_plataforma",
];
const GROUP_VALUES = [
  GROUP_HEADERS,
  ["g-1", "123", "Grupo", 1, true, "", "", "", "", "token", 0, "", "", "", "", ""],
];
const source = readFileSync(new URL("./Code.js", import.meta.url), "utf8");

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function makeHarness() {
  const calls = { batchUpdate: [] as unknown[], lock: 0, release: 0, lockAvailable: true, throwAfterBatch: false };
  const ledger: unknown[][] = [[...LEDGER_HEADERS]];
  const valuesByRange: Record<string, unknown[][]> = {
    "grupos!A:P": GROUP_VALUES.map((row) => [...row]),
    "grupo_horarios!A:K": [
      ["horario_id", "grupo_id", "dia_semana", "hora_inicio", "link_reuniao", "ativo", "created_at", "updated_at", "plataforma_id", "vigente_desde", "vigente_ate"],
      ["h-1", "g-1", "segunda", "20:00", "", true, "", "", "", "", ""],
    ],
    "grupo_servidores_mesa!A:I": [
      ["grupo_servidor_mesa_id", "grupo_id", "encargo", "nome", "data_inicio", "ativo", "ordem", "created_at", "updated_at"],
      ["m-1", "g-1", "Coordenador", "Nome", "", true, 1, "", ""],
    ],
    "usuarios_grupo!A:K": [["usuario_id", "grupo_id", "email", "nome", "senha_hash", "status", "convite_token", "convite_expira_em", "ultimo_login", "created_at", "updated_at"], ["u-1", "g-1", "resp@example.com", "Responsável", "", "ativo", "", "", "", "", ""]],
    "atas!A:AD": [],
  };
  const properties = {
    getProperty(name: string) {
      return name === "GATEWAY_HMAC_SECRET"
        ? SECRET
        : name === "SPREADSHEET_ID"
          ? SPREADSHEET_ID
          : name === "GATEWAY_ADMIN_EMAILS"
            ? "admin@example.com"
          : null;
    },
  };
  const context = {
    Date,
    JSON,
    Math,
    Number,
    Object,
    RegExp,
    Set,
    String,
    Array,
    Error,
    PropertiesService: { getScriptProperties: () => properties },
    LockService: {
      getScriptLock: () => ({
        tryLock: (timeout: number) => {
          calls.lock += 1;
          return timeout === 30_000 && calls.lockAvailable;
        },
        releaseLock: () => { calls.release += 1; },
      }),
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA-256" },
      computeHmacSha256Signature: (value: string, key: string) =>
        createHmac("sha256", key).update(value).digest(),
      base64EncodeWebSafe: (value: Buffer) =>
        value.toString("base64").replace(/\+/g, "-").replace(/\//g, "_"),
      computeDigest: (_algorithm: string, value: string) =>
        [...createHash("sha256").update(value, "utf8").digest()].map((byte) =>
          byte > 127 ? byte - 256 : byte,
        ),
      newBlob: (value: string) => ({
        getBytes: () => [...Buffer.from(value, "utf8")].map((byte) =>
          byte > 127 ? byte - 256 : byte,
        ),
      }),
    },
    Sheets: {
      Spreadsheets: {
        get: () => ({
          sheets: [
            { properties: { title: "grupos", sheetId: 1 } },
            { properties: { title: "operacoes", sheetId: 2 } },
          { properties: { title: "atas", sheetId: 3 } },
          { properties: { title: "usuarios_grupo", sheetId: 4 } },
          { properties: { title: "grupo_horarios", sheetId: 5 } },
          { properties: { title: "grupo_servidores_mesa", sheetId: 6 } },
          { properties: { title: "servidores", sheetId: 7 } },
          ],
        }),
        Values: {
          get: (_spreadsheetId: string, range: string) => ({
            values: range === "operacoes!A:H"
              ? ledger.map((row) => [...row])
              : valuesByRange[range],
          }),
        },
        batchUpdate: (request: { requests: Record<string, unknown>[] }) => {
          calls.batchUpdate.push(request);
          const ledgerWrite = request.requests.find((item) => {
            const update = item.updateCells as { range?: { sheetId?: number } } | undefined;
            return update?.range?.sheetId === 2;
          })?.updateCells as {
            range: { startRowIndex: number };
            rows: { values: { userEnteredValue: { stringValue: string } }[] }[];
          } | undefined;
          if (ledgerWrite) {
            ledger[ledgerWrite.range.startRowIndex] = ledgerWrite.rows[0].values.map(
              (cell) => cell.userEnteredValue.stringValue,
            );
          }
          if (calls.throwAfterBatch) throw new Error("synthetic response loss after atomic batch");
          return {};
        },
      },
    },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (content: string) => ({
        content,
        setMimeType() { return this; },
      }),
    },
  };
  runInNewContext(source, context);
  return { context: context as typeof context & { doPost: (event: unknown) => { content: string } }, calls, ledger, valuesByRange };
}

function signedRequest(overrides: {
  operationId?: string;
  actor?: string;
  type?: string;
  intent?: unknown;
  authorization?: unknown;
  guardHash?: string;
  guardRange?: string;
  endColumnIndex?: number;
  startRowIndex?: number;
  signature?: string;
  requests?: unknown[];
} = {}) {
  const timestamp = Date.now();
  const intent = overrides.intent ?? { grupo_id: "g-1", action: "test" };
  const payload = {
    actor: overrides.actor ?? "admin@example.com",
    authorization: overrides.authorization ?? { kind: "authenticated", email: "admin@example.com" },
    intent,
    quantidade_atas: 1,
    guards: [{
      range: overrides.guardRange ?? "grupos!A:P",
      sha256: overrides.guardHash ?? createHash("sha256").update(canonicalJson(GROUP_VALUES)).digest("hex"),
    }],
    requests: overrides.requests ?? [{
      updateCells: {
        range: {
          sheetId: 1,
          startRowIndex: overrides.startRowIndex ?? 1,
          endRowIndex: (overrides.startRowIndex ?? 1) + 1,
          startColumnIndex: 0,
          endColumnIndex: overrides.endColumnIndex ?? 1,
        },
        rows: [{ values: [{ userEnteredValue: { stringValue: "g-1" } }] }],
        fields: "userEnteredValue",
      },
    }],
  };
  const operation = {
    operacao_id: overrides.operationId ?? OPERATION_ID,
    tipo: overrides.type ?? "salvar_grupo",
    hash_solicitacao: createHash("sha256").update(canonicalJson(intent)).digest("hex"),
    quantidade_atas: 1,
    payload_bytes: Buffer.byteLength(canonicalJson(payload), "utf8"),
    payload,
  };
  const signature = createHmac("sha256", SECRET)
    .update(`${timestamp}.${canonicalJson(operation)}`)
    .digest("base64url");
  return {
    timestamp,
    operation,
    signature: overrides.signature ?? signature,
  };
}

function post(harness: ReturnType<typeof makeHarness>, body: unknown) {
  return JSON.parse(harness.context.doPost({
    postData: { contents: JSON.stringify(body) },
  }).content) as { ok: boolean; code?: string; message?: string; existing?: boolean };
}

function signedStatusQuery(overrides: { operationId?: string; hash?: string; signature?: string } = {}) {
  const timestamp = Date.now();
  const query = {
    operacao_id: overrides.operationId ?? OPERATION_ID,
    hash_solicitacao: overrides.hash ?? createHash("sha256").update(canonicalJson({ grupo_id: "g-1", action: "test" })).digest("hex"),
  };
  const signature = createHmac("sha256", SECRET)
    .update(`${timestamp}.${canonicalJson(query)}`)
    .digest("base64url");
  return { timestamp, query, signature: overrides.signature ?? signature };
}

describe("gateway Apps Script em harness local", () => {
  function userUpdateRequest(row: string[]) {
    return { updateCells: {
      range: { sheetId: 4, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 11 },
      rows: [{ values: row.map((value) => ({ userEnteredValue: { stringValue: value } })) }],
      fields: "userEnteredValue",
    } };
  }

  function groupRowUpdateRequest(sheetId: number, firstCell: string) {
    return { updateCells: {
      range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 2 },
      rows: [{ values: [firstCell, "g-1"].map((value) => ({ userEnteredValue: { stringValue: value } })) }],
      fields: "userEnteredValue",
    } };
  }

  function currentUserRows(harness: ReturnType<typeof makeHarness>) {
    return harness.valuesByRange["usuarios_grupo!A:K"];
  }

  function userGuard(harness: ReturnType<typeof makeHarness>) {
    return {
      guardRange: "usuarios_grupo!A:K",
      guardHash: createHash("sha256").update(canonicalJson(currentUserRows(harness))).digest("hex"),
    };
  }

  function indexUpdateRequest() {
    const values = Array.from({ length: 30 }, (_, index) => ({
      userEnteredValue: { stringValue: index === 0 ? "ata-1" : index === 3 ? "g-1" : "" },
    }));
    return {
      updateCells: {
        range: { sheetId: 3, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 30 },
        rows: [{ values }],
        fields: "userEnteredValue",
      },
    };
  }

  function setCurrentAta(harness: ReturnType<typeof makeHarness>) {
    const headers = Array.from({ length: 30 }, (_, index) => `coluna_${index}`);
    const row = Array.from({ length: 30 }, () => "");
    headers[0] = "ata_id";
    headers[3] = "grupo_id";
    row[0] = "ata-1";
    row[3] = "g-1";
    harness.valuesByRange["atas!A:AD"] = [headers, row];
  }

  it("revalida admin configurado para alteração do índice dentro do lock", () => {
    const harness = makeHarness();
    setCurrentAta(harness);
    const request = signedRequest({
      type: "atualizar_indice_ata",
      actor: "ADMIN@example.com",
      intent: { ata_id: "ata-1", indice_personalizado_grupo: 8 },
      requests: [indexUpdateRequest()],
    });
    expect(post(harness, request)).toMatchObject({ ok: true, existing: false });
    expect(harness.calls.lock).toBe(1);
  });

  it("recusa responsável que não tem usuário ativo no grupo da ata", () => {
    const harness = makeHarness();
    setCurrentAta(harness);
    const request = signedRequest({
      type: "atualizar_indice_ata",
      actor: "other@example.com",
      intent: { ata_id: "ata-1", indice_personalizado_grupo: 8 },
      requests: [indexUpdateRequest()],
    });
    expect(post(harness, request)).toMatchObject({
      ok: false,
      code: "INVALID_REQUEST",
      message: "Usuário sem permissão ativa para este grupo.",
    });
    expect(harness.calls.batchUpdate).toHaveLength(0);
  });

  it("valida HMAC e guard, obtém lock e grava mutação mais ledger em um lote", () => {
    const harness = makeHarness();
    expect(post(harness, signedRequest())).toMatchObject({ ok: true, existing: false });
    expect(harness.calls.lock).toBe(1);
    expect(harness.calls.release).toBe(1);
    expect(harness.calls.batchUpdate).toHaveLength(1);
    expect((harness.calls.batchUpdate[0] as { requests: unknown[] }).requests).toHaveLength(2);
    expect(harness.ledger[1][0]).toBe(OPERATION_ID);
    expect(harness.ledger[1][4]).toBe("concluida");
  });

  it("aceita responsável somente no grupo ativo vinculado", () => {
    const harness = makeHarness();
    expect(post(harness, signedRequest({
      actor: "resp@example.com",
      authorization: { kind: "authenticated", email: "resp@example.com" },
    })).ok).toBe(true);
  });

  it("recusa responsável sem vínculo no grupo indicado", () => {
    const harness = makeHarness();
    expect(post(harness, signedRequest({
      actor: "resp@example.com",
      authorization: { kind: "authenticated", email: "resp@example.com" },
      intent: { grupo_id: "g-2", action: "test" },
    })).ok).toBe(false);
    expect(harness.calls.batchUpdate).toHaveLength(0);
  });

  it("limita responsável aos campos de grupo permitidos pela aplicação", () => {
    const harness = makeHarness();
    const request = signedRequest({
      actor: "resp@example.com",
      authorization: { kind: "authenticated", email: "resp@example.com" },
      endColumnIndex: 2,
      requests: [{ updateCells: {
        range: { sheetId: 1, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 2 },
        rows: [{ values: [
          { userEnteredValue: { stringValue: "g-1" } },
          { userEnteredValue: { stringValue: "zoom-id-adulterado" } },
        ] }],
        fields: "userEnteredValue",
      } }],
    });
    expect(post(harness, request)).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
    expect(harness.calls.batchUpdate).toHaveLength(0);
  });

  it.each([
    ["horário", "salvar_horario_grupo", 5, "h-1"],
    ["equipe da mesa", "salvar_equipe_mesa_grupo", 6, "m-1"],
    ["servidor da mesa", "salvar_servidor_mesa_grupo", 6, "m-1"],
    ["desativação de servidor da mesa", "desativar_servidor_mesa_grupo", 6, "m-1"],
  ])("revalida grupo ativo e vínculo autenticado para escrita de %s", (_label, type, sheetId, rowId) => {
    const harness = makeHarness();
    const request = signedRequest({
      type,
      actor: "resp@example.com",
      authorization: { kind: "authenticated", email: "resp@example.com" },
      intent: { grupo_id: "g-1", recurso_id: rowId },
      requests: [groupRowUpdateRequest(sheetId, rowId)],
    });
    expect(post(harness, request)).toMatchObject({ ok: true });
  });

  it("revalida grupo ativo e vínculo autenticado para exclusão de horário", () => {
    const harness = makeHarness();
    const request = signedRequest({
      type: "excluir_horarios_grupo",
      actor: "resp@example.com",
      authorization: { kind: "authenticated", email: "resp@example.com" },
      intent: { grupo_id: "g-1", horario_ids: ["h-1"] },
      requests: [{ deleteDimension: {
        range: { sheetId: 5, dimension: "ROWS", startIndex: 1, endIndex: 2 },
      } }],
    });
    expect(post(harness, request)).toMatchObject({ ok: true });
  });

  it.each([
    ["administrador", "admin@example.com", { kind: "authenticated", email: "admin@example.com" }],
    ["responsável do grupo", "resp@example.com", { kind: "authenticated", email: "resp@example.com" }],
    ["link público ativo", "public-link", { kind: "public_ata_link", token: "token" }],
  ])("autoriza criação de ata por %s dentro do grupo validado", (_label, actor, authorization) => {
    const harness = makeHarness();
    const headers = Array.from({ length: 30 }, (_, index) => `coluna_${index}`);
    headers[0] = "ata_id";
    headers[3] = "grupo_id";
    harness.valuesByRange["atas!A:AD"] = [headers];
    const values = Array.from({ length: 30 }, () => ({ userEnteredValue: { stringValue: "" } }));
    values[0] = { userEnteredValue: { stringValue: "ata-nova" } };
    values[3] = { userEnteredValue: { stringValue: "g-1" } };
    const request = signedRequest({
      type: "criar_ata",
      actor,
      authorization,
      intent: { ata_id: "ata-nova", ata: { grupo_id: "g-1" } },
      requests: [{ updateCells: {
        range: { sheetId: 3, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 30 },
        rows: [{ values }],
        fields: "userEnteredValue",
      } }],
    });
    expect(post(harness, request)).toMatchObject({ ok: true });
  });

  it("recusa administrador ao criar ata para grupo inativo", () => {
    const harness = makeHarness();
    harness.valuesByRange["grupos!A:P"][1][4] = false;
    const headers = Array.from({ length: 30 }, (_, index) => `coluna_${index}`);
    headers[0] = "ata_id";
    headers[3] = "grupo_id";
    harness.valuesByRange["atas!A:AD"] = [headers];
    const values = Array.from({ length: 30 }, () => ({ userEnteredValue: { stringValue: "" } }));
    values[0] = { userEnteredValue: { stringValue: "ata-inativa" } };
    values[3] = { userEnteredValue: { stringValue: "g-1" } };
    const request = signedRequest({
      type: "criar_ata",
      actor: "admin@example.com",
      authorization: { kind: "authenticated", email: "admin@example.com" },
      guardHash: createHash("sha256").update(canonicalJson(harness.valuesByRange["grupos!A:P"])).digest("hex"),
      intent: { ata_id: "ata-inativa", ata: { grupo_id: "g-1" } },
      requests: [{ updateCells: {
        range: { sheetId: 3, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 30 },
        rows: [{ values }],
        fields: "userEnteredValue",
      } }],
    });
    expect(post(harness, request)).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
    expect(harness.calls.batchUpdate).toHaveLength(0);
  });

  it("recusa criação pública quando o token pertence a outro grupo", () => {
    const harness = makeHarness();
    const headers = Array.from({ length: 30 }, (_, index) => `coluna_${index}`);
    headers[0] = "ata_id";
    headers[3] = "grupo_id";
    harness.valuesByRange["atas!A:AD"] = [headers];
    const values = Array.from({ length: 30 }, () => ({ userEnteredValue: { stringValue: "" } }));
    values[0] = { userEnteredValue: { stringValue: "ata-nova" } };
    values[3] = { userEnteredValue: { stringValue: "g-2" } };
    const request = signedRequest({
      type: "criar_ata",
      actor: "public-link",
      authorization: { kind: "public_ata_link", token: "token" },
      intent: { ata_id: "ata-nova", ata: { grupo_id: "g-2" } },
      requests: [{ updateCells: {
        range: { sheetId: 3, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 30 },
        rows: [{ values }],
        fields: "userEnteredValue",
      } }],
    });
    expect(post(harness, request)).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
    expect(harness.calls.batchUpdate).toHaveLength(0);
  });

  it("permite ativação somente com token pendente ainda válido", () => {
    const harness = makeHarness();
    harness.valuesByRange["usuarios_grupo!A:K"][1] = [
      "u-1", "g-1", "resp@example.com", "Responsável", "", "pendente", "invite-token",
      "2099-01-01T00:00:00.000Z", "", "", "",
    ];
    const row = ["u-1", "g-1", "resp@example.com", "Responsável", "hash-novo", "ativo", "", "", "", "", "updated"];
    const request = signedRequest({
      type: "salvar_usuario_grupo",
      actor: "operador-tecnico",
      authorization: { kind: "activation_token", token: "invite-token", usuario_id: "u-1" },
      intent: { usuario_id: "u-1", grupo_id: "g-1" },
      requests: [{ updateCells: {
        range: { sheetId: 4, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 11 },
        rows: [{ values: row.map((value) => ({ userEnteredValue: { stringValue: value } })) }],
        fields: "userEnteredValue",
      } }],
    });
    expect(post(harness, request)).toMatchObject({ ok: true });
  });

  it("recusa ativação com token diferente do convite atual", () => {
    const harness = makeHarness();
    harness.valuesByRange["usuarios_grupo!A:K"][1] = [
      "u-1", "g-1", "resp@example.com", "Responsável", "", "pendente", "invite-token",
      "2099-01-01T00:00:00.000Z", "", "", "",
    ];
    const row = ["u-1", "g-1", "resp@example.com", "Responsável", "hash-novo", "ativo", "", "", "", "", "updated"];
    const request = signedRequest({
      type: "salvar_usuario_grupo",
      actor: "operador-tecnico",
      authorization: { kind: "activation_token", token: "token-antigo", usuario_id: "u-1" },
      intent: { usuario_id: "u-1", grupo_id: "g-1" },
      requests: [{ updateCells: {
        range: { sheetId: 4, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 11 },
        rows: [{ values: row.map((value) => ({ userEnteredValue: { stringValue: value } })) }],
        fields: "userEnteredValue",
      } }],
    });
    expect(post(harness, request)).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
    expect(harness.calls.batchUpdate).toHaveLength(0);
  });

  it("permite login validado atualizar somente os metadados de último acesso", () => {
    const harness = makeHarness();
    const row = [...currentUserRows(harness)[1]];
    row[8] = "2099-01-01T00:00:00.000Z";
    row[10] = "updated";
    const request = signedRequest({
      type: "salvar_usuario_grupo",
      actor: "operador-tecnico",
      authorization: { kind: "validated_login", usuario_id: "u-1" },
      intent: { usuario_id: "u-1", grupo_id: "g-1" },
      ...userGuard(harness),
      requests: [userUpdateRequest(row)],
    });
    expect(post(harness, request)).toMatchObject({ ok: true });
    expect(harness.calls.batchUpdate).toHaveLength(1);
  });

  it("permite solicitação de recuperação sem inventar identidade autenticada", () => {
    const harness = makeHarness();
    const row = [...currentUserRows(harness)[1]];
    row[6] = "recovery-token";
    row[7] = "2099-01-02T00:00:00.000Z";
    row[10] = "updated";
    const request = signedRequest({
      type: "salvar_usuario_grupo",
      actor: "operador-tecnico",
      authorization: { kind: "password_recovery", usuario_id: "u-1" },
      intent: { usuario_id: "u-1", grupo_id: "g-1" },
      ...userGuard(harness),
      requests: [userUpdateRequest(row)],
    });
    expect(post(harness, request)).toMatchObject({ ok: true });
    expect(harness.calls.batchUpdate).toHaveLength(1);
  });

  it("permite redefinição somente com token atual ainda válido", () => {
    const harness = makeHarness();
    currentUserRows(harness)[1][6] = "reset-token";
    currentUserRows(harness)[1][7] = "2099-01-02T00:00:00.000Z";
    const row = [...currentUserRows(harness)[1]];
    row[4] = "hash-novo";
    row[6] = "";
    row[7] = "";
    row[10] = "updated";
    const request = signedRequest({
      type: "salvar_usuario_grupo",
      actor: "operador-tecnico",
      authorization: { kind: "password_reset_token", token: "reset-token", usuario_id: "u-1" },
      intent: { usuario_id: "u-1", grupo_id: "g-1" },
      ...userGuard(harness),
      requests: [userUpdateRequest(row)],
    });
    expect(post(harness, request)).toMatchObject({ ok: true });
    expect(harness.calls.batchUpdate).toHaveLength(1);
  });

  it("sincroniza usuário somente para admin configurado e grupo informado", () => {
    const harness = makeHarness();
    const row = [...currentUserRows(harness)[1]];
    row[3] = "Nome atualizado";
    row[10] = "updated";
    const request = signedRequest({
      type: "salvar_usuario_grupo",
      authorization: { kind: "authenticated", email: "admin@example.com" },
      intent: { usuario_id: "u-1", grupo_id: "g-1" },
      ...userGuard(harness),
      requests: [userUpdateRequest(row)],
    });
    expect(post(harness, request)).toMatchObject({ ok: true });
  });

  it("permite simulação operacional apenas para grupo ativo, sem identidade de sessão", () => {
    const harness = makeHarness();
    const headers = Array.from({ length: 30 }, (_, index) => `coluna_${index}`);
    headers[0] = "ata_id";
    headers[3] = "grupo_id";
    harness.valuesByRange["atas!A:AD"] = [headers];
    const row = Array.from({ length: 30 }, () => ({ userEnteredValue: { stringValue: "" } }));
    row[0] = { userEnteredValue: { stringValue: "ata-simulada" } };
    row[3] = { userEnteredValue: { stringValue: "g-1" } };
    const request = signedRequest({
      type: "simular_atas_mensais",
      actor: "operador-tecnico",
      authorization: { kind: "operational_simulation" },
      intent: { grupo_id: "g-1", mes: "2026-08" },
      requests: [
        { appendDimension: { sheetId: 3, dimension: "ROWS", length: 1 } },
        { updateCells: {
          range: { sheetId: 3, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 30 },
          rows: [{ values: row }],
          fields: "userEnteredValue",
        } },
      ],
    });
    expect(post(harness, request)).toMatchObject({ ok: true });
    expect(harness.calls.batchUpdate).toHaveLength(1);
  });

  it("recusa simulação que grava ata em grupo diferente do declarado", () => {
    const harness = makeHarness();
    const headers = Array.from({ length: 30 }, (_, index) => `coluna_${index}`);
    headers[0] = "ata_id";
    headers[3] = "grupo_id";
    harness.valuesByRange["atas!A:AD"] = [headers];
    const row = Array.from({ length: 30 }, () => ({ userEnteredValue: { stringValue: "" } }));
    row[0] = { userEnteredValue: { stringValue: "ata-fora-do-grupo" } };
    row[3] = { userEnteredValue: { stringValue: "g-2" } };
    const request = signedRequest({
      type: "simular_atas_mensais",
      actor: "operador-tecnico",
      authorization: { kind: "operational_simulation" },
      intent: { grupo_id: "g-1", mes: "2026-08" },
      requests: [{ updateCells: {
        range: { sheetId: 3, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 30 },
        rows: [{ values: row }],
        fields: "userEnteredValue",
      } }],
    });
    expect(post(harness, request)).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
    expect(harness.calls.batchUpdate).toHaveLength(0);
  });

  it("recusa dependente de simulação que referencia outra ata", () => {
    const harness = makeHarness();
    const ataHeaders = Array.from({ length: 30 }, (_, index) => `coluna_${index}`);
    ataHeaders[0] = "ata_id";
    ataHeaders[3] = "grupo_id";
    harness.valuesByRange["atas!A:AD"] = [ataHeaders];
    harness.valuesByRange["servidores!A:Z"] = [["servidor_id", "ata_id"]];
    const ataRow = Array.from({ length: 30 }, () => ({ userEnteredValue: { stringValue: "" } }));
    ataRow[0] = { userEnteredValue: { stringValue: "ata-1" } };
    ataRow[3] = { userEnteredValue: { stringValue: "g-1" } };
    const request = signedRequest({
      type: "simular_atas_mensais",
      actor: "operador-tecnico",
      authorization: { kind: "operational_simulation" },
      intent: { grupo_id: "g-1", mes: "2026-08" },
      requests: [
        { updateCells: {
          range: { sheetId: 3, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 30 },
          rows: [{ values: ataRow }],
          fields: "userEnteredValue",
        } },
        { updateCells: {
          range: { sheetId: 7, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 2 },
          rows: [{ values: ["srv-1", "ata-estranha"].map((value) => ({ userEnteredValue: { stringValue: value } })) }],
          fields: "userEnteredValue",
        } },
      ],
    });
    expect(post(harness, request)).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
    expect(harness.calls.batchUpdate).toHaveLength(0);
  });

  it("limita reparo operacional de link ao token e data de atualização", () => {
    const harness = makeHarness();
    const row = GROUP_VALUES[1].map((value) => ({
      userEnteredValue: typeof value === "boolean"
        ? { boolValue: value }
        : typeof value === "number"
          ? { numberValue: value }
          : { stringValue: String(value) },
    }));
    row[9] = { userEnteredValue: { stringValue: "novo-token-operacional-com-mais-de-quarenta-caracteres" } };
    row[12] = { userEnteredValue: { stringValue: "updated" } };
    const request = signedRequest({
      type: "salvar_grupo",
      actor: "operador-tecnico",
      authorization: { kind: "operational_link_repair" },
      intent: { grupo_id: "g-1", action: "repair-link" },
      requests: [{ updateCells: {
        range: { sheetId: 1, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 16 },
        rows: [{ values: row }],
        fields: "userEnteredValue",
      } }],
    });
    expect(post(harness, request)).toMatchObject({ ok: true });
  });

  it("recusa reparo operacional de link que altera nome do grupo", () => {
    const harness = makeHarness();
    const row = GROUP_VALUES[1].map((value) => ({
      userEnteredValue: typeof value === "boolean"
        ? { boolValue: value }
        : typeof value === "number"
          ? { numberValue: value }
          : { stringValue: String(value) },
    }));
    row[2] = { userEnteredValue: { stringValue: "Nome adulterado" } };
    row[9] = { userEnteredValue: { stringValue: "novo-token-operacional-com-mais-de-quarenta-caracteres" } };
    const request = signedRequest({
      type: "salvar_grupo",
      actor: "operador-tecnico",
      authorization: { kind: "operational_link_repair" },
      intent: { grupo_id: "g-1", action: "repair-link" },
      requests: [{ updateCells: {
        range: { sheetId: 1, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 16 },
        rows: [{ values: row }],
        fields: "userEnteredValue",
      } }],
    });
    expect(post(harness, request)).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
    expect(harness.calls.batchUpdate).toHaveLength(0);
  });

  it("reconhece repetição idêntica sem aplicar uma segunda gravação", () => {
    const harness = makeHarness();
    const request = signedRequest();
    expect(post(harness, request)).toMatchObject({ ok: true, existing: false });
    expect(post(harness, request)).toMatchObject({ ok: true, existing: true });
    expect(harness.calls.batchUpdate).toHaveLength(1);
  });

  it.each([
    ["assinatura incorreta", () => signedRequest({ signature: "invalid" })],
    ["guard divergente", () => signedRequest({ guardHash: "0".repeat(64) })],
    ["coluna fora do contrato", () => signedRequest({ endColumnIndex: 31 })],
    ["linha de cabeçalho", () => signedRequest({ startRowIndex: 0 })],
    ["expansão de coluna", () => signedRequest({ requests: [{ appendDimension: { sheetId: 1, dimension: "COLUMNS", length: 1 } }] })],
    ["expansão acima do limite", () => signedRequest({ requests: [{ appendDimension: { sheetId: 1, dimension: "ROWS", length: 1001 } }] })],
    ["expansão do ledger", () => signedRequest({ requests: [{ appendDimension: { sheetId: 2, dimension: "ROWS", length: 1 } }] })],
  ])("recusa %s antes da escrita", (_label, requestFactory) => {
    const harness = makeHarness();
    const result = post(harness, requestFactory());
    expect(result.ok).toBe(false);
    expect(harness.calls.batchUpdate).toHaveLength(0);
    expect(harness.ledger).toHaveLength(1);
  });

  it("recusa reutilização do operacao_id com hash divergente", () => {
    const harness = makeHarness();
    expect(post(harness, signedRequest()).ok).toBe(true);
    expect(post(harness, signedRequest({ intent: { grupo_id: "g-2" } }))).toMatchObject({
      ok: false,
    });
    expect(harness.calls.batchUpdate).toHaveLength(1);
  });

  it("permite expandir linhas de aba de negócio no mesmo lote da escrita e do ledger", () => {
    const harness = makeHarness();
    const request = signedRequest({ requests: [
      { appendDimension: { sheetId: 1, dimension: "ROWS", length: 3 } },
      {
        updateCells: {
          range: { sheetId: 1, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 1 },
          rows: [{ values: [{ userEnteredValue: { stringValue: "g-1" } }] }],
          fields: "userEnteredValue",
        },
      },
    ] });
    expect(post(harness, request)).toMatchObject({ ok: true, existing: false });
    const batch = harness.calls.batchUpdate[0] as { requests: Record<string, unknown>[] };
    expect(batch.requests.map((item) => Object.keys(item))).toEqual([
      ["appendDimension"],
      ["updateCells"],
      ["updateCells"],
    ]);
  });

  it("remove campos não permitidos antes de encaminhar o lote ao Sheets", () => {
    const harness = makeHarness();
    const request = signedRequest({ requests: [{
      updateCells: {
        range: { sheetId: 1, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 1 },
        rows: [{ values: [{ userEnteredValue: { stringValue: "g-1" } }] }],
        fields: "userEnteredValue",
      },
      deleteSheet: { sheetId: 1 },
    }] });
    expect(post(harness, request)).toMatchObject({ ok: true, existing: false });
    const batch = harness.calls.batchUpdate[0] as { requests: Record<string, unknown>[] };
    expect(batch.requests[0]).toEqual({
      updateCells: expect.objectContaining({ fields: "userEnteredValue" }),
    });
    expect(batch.requests[0]).not.toHaveProperty("deleteSheet");
  });

  it("consulta como aplicada quando encontra operação concluída com hash correspondente", () => {
    const harness = makeHarness();
    expect(post(harness, signedRequest())).toMatchObject({ ok: true });
    expect(post(harness, signedStatusQuery())).toMatchObject({
      ok: true,
      state: "aplicada",
      safe_to_retry: false,
      resultado_ref: OPERATION_ID,
    });
    expect(harness.calls.batchUpdate).toHaveLength(1);
  });

  it("trata ausência no ledger como incerta e nunca como autorização para repetir", () => {
    const harness = makeHarness();
    expect(post(harness, signedStatusQuery())).toMatchObject({
      ok: true,
      state: "nao_encontrada",
      safe_to_retry: false,
    });
  });

  it("não revela resultado se o mesmo ID for consultado com hash diferente", () => {
    const harness = makeHarness();
    expect(post(harness, signedRequest()).ok).toBe(true);
    expect(post(harness, signedStatusQuery({ hash: "f".repeat(64) }))).toMatchObject({
      ok: true,
      state: "conflito",
      safe_to_retry: false,
    });
  });

  it("retorna estado indeterminado quando não consegue obter o lock", () => {
    const harness = makeHarness();
    harness.calls.lockAvailable = false;
    expect(post(harness, signedStatusQuery())).toMatchObject({
      ok: true,
      state: "indeterminada",
      safe_to_retry: false,
    });
    expect(harness.calls.release).toBe(0);
  });

  it("recusa consulta de status com assinatura inválida antes de ler o ledger", () => {
    const harness = makeHarness();
    expect(post(harness, signedStatusQuery({ signature: "invalid" }))).toMatchObject({
      ok: false,
    });
    expect(harness.calls.lock).toBe(0);
    expect(harness.calls.batchUpdate).toHaveLength(0);
  });

  it("informa resultado desconhecido após erro do batch e permite conciliá-lo pelo ledger", () => {
    const harness = makeHarness();
    harness.calls.throwAfterBatch = true;
    expect(post(harness, signedRequest())).toMatchObject({
      ok: false,
      code: "WRITE_RESULT_UNKNOWN",
    });
    expect(post(harness, signedStatusQuery())).toMatchObject({
      ok: true,
      state: "aplicada",
      safe_to_retry: false,
    });
    expect(harness.calls.batchUpdate).toHaveLength(1);
  });
});
