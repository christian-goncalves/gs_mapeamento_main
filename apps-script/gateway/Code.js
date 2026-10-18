const OPERATION_HEADERS = [
  "operacao_id",
  "hash_solicitacao",
  "tipo",
  "ator",
  "estado",
  "criada_em",
  "concluida_em",
  "resultado_ref",
];
const MAX_ATAS_PER_OPERATION = 50;
const MAX_OPERATION_PAYLOAD_BYTES = 1572864;
const MAX_CLOCK_SKEW_MS = 300000;
const CONTRACT_SHEETS = new Set([
  "grupos",
  "usuarios_grupo",
  "grupo_horarios",
  "grupo_servidores_mesa",
  "atas",
  "servidores",
  "participacao",
  "visitantes",
  "ingressos",
  "trocas_chaveiro",
  "grupo_plataformas",
  "operacoes",
]);
const SHEET_COLUMN_LIMITS = {
  grupos: 16,
  usuarios_grupo: 11,
  grupo_horarios: 11,
  grupo_servidores_mesa: 9,
  atas: 30,
  servidores: 7,
  participacao: 8,
  visitantes: 8,
  ingressos: 7,
  trocas_chaveiro: 5,
  grupo_plataformas: 8,
};

// Apps Script invokes this global web-app entry point by name.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function doPost(event) {
  try {
    const body = JSON.parse(event.postData.contents);
    return jsonOutput(body && body.query ? handleOperationStatus(body) : handleOperation(body));
  } catch (error) {
    return jsonOutput({
      ok: false,
      code: "INVALID_REQUEST",
      message: error instanceof Error ? error.message : "Solicitação inválida.",
    });
  }
}

function handleOperation(body) {
  const properties = PropertiesService.getScriptProperties();
  const secret = properties.getProperty("GATEWAY_HMAC_SECRET");
  const spreadsheetId = properties.getProperty("SPREADSHEET_ID");
  if (!secret || !spreadsheetId) throw new Error("Gateway não configurado.");
  const operation = body.operation;
  if (!operation || typeof operation !== "object") throw new Error("Operação ausente.");
  verifySignedValue(body, operation, secret);

  const operationId = String(operation.operacao_id || "");
  const operationHash = String(operation.hash_solicitacao || "");
  const payload = operation.payload;
  const payloadJson = canonicalJson(payload);
  const payloadBytes = Utilities.newBlob(payloadJson).getBytes().length;
  if (!operationId || !operationHash) throw new Error("ID/hash da operação ausente.");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(operationId)) throw new Error("operacao_id inválido.");
  if (!/^[0-9a-f]{64}$/i.test(operationHash)) throw new Error("Hash da operação inválido.");
  if (sha256Hex(canonicalJson(payload.intent)) !== operationHash) throw new Error("Hash da intenção não confere.");
  if (payloadBytes !== operation.payload_bytes || payloadBytes > MAX_OPERATION_PAYLOAD_BYTES) {
    throw new Error("Tamanho do payload inválido ou acima do limite.");
  }
  if (!Number.isInteger(operation.quantidade_atas) || operation.quantidade_atas < 1 || operation.quantidade_atas > MAX_ATAS_PER_OPERATION) {
    throw new Error("Quantidade de atas fora do limite.");
  }
  validatePayload(payload);

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error("Lock indisponível; operação não aplicada.");
  try {
    const sheets = Sheets.Spreadsheets.get(spreadsheetId, {
      fields: "sheets(properties(sheetId,title))",
    }).sheets || [];
    const ids = Object.fromEntries(sheets.map((sheet) => [sheet.properties.title, sheet.properties.sheetId]));
    const ledgerId = ids.operacoes;
    if (!Number.isInteger(ledgerId)) throw new Error("Ledger operacoes ausente.");
    const ledgerValues = Sheets.Spreadsheets.Values.get(spreadsheetId, "operacoes!A:H").values || [];
    if (!sameArray(ledgerValues[0] || [], OPERATION_HEADERS)) throw new Error("Cabeçalho do ledger inválido.");

    const previousIndex = ledgerValues.findIndex((row, index) => index > 0 && row[0] === operationId);
    if (previousIndex >= 0) {
      const previous = ledgerValues[previousIndex];
      if (previous[1] !== operationHash) throw new Error("operacao_id reutilizado com hash diferente.");
      if (previous[4] !== "concluida") throw new Error("Operação existente em estado não concluído; reconciliação necessária.");
      return { ok: true, existing: true, resultado_ref: previous[7] || operationId };
    }

    if (operation.tipo === "atualizar_indice_ata") {
      validateAtaIndexAuthorization(spreadsheetId, operation, payload, ids);
    } else {
      validateBusinessAuthorization(spreadsheetId, operation, payload, ids);
    }
    validateGuards(spreadsheetId, payload.guards || []);
    const requests = payload.requests.map((request) => validateAndPrepareRequest(request, ids));
    const nextRow = ledgerValues.length + 1;
    const now = new Date().toISOString();
    requests.push({
      updateCells: {
        range: { sheetId: ledgerId, startRowIndex: nextRow - 1, endRowIndex: nextRow, startColumnIndex: 0, endColumnIndex: OPERATION_HEADERS.length },
        rows: [{ values: [
          operationId,
          operationHash,
          String(operation.tipo),
          String(payload.actor),
          "concluida",
          now,
          now,
          operationId,
        ].map((value) => ({ userEnteredValue: { stringValue: value } })) }],
        fields: "userEnteredValue",
      },
    });

    try {
      Sheets.Spreadsheets.batchUpdate({ requests }, spreadsheetId);
    } catch {
      return {
        ok: false,
        code: "WRITE_RESULT_UNKNOWN",
        message: "O resultado da gravação não foi confirmado; consulte o ledger antes de qualquer nova tentativa.",
        operacao_id: operationId,
      };
    }
    return { ok: true, existing: false, resultado_ref: operationId };
  } finally {
    lock.releaseLock();
  }
}

function validateBusinessAuthorization(spreadsheetId, operation, payload, sheetIds) {
  const authorization = payload.authorization;
  if (!authorization || typeof authorization !== "object") {
    throw new Error("Autorização da operação ausente.");
  }
  if (operation.tipo === "criar_ata") {
    const intentAta = payload.intent && payload.intent.ata;
    const groupId = String(intentAta && intentAta.grupo_id || "");
    if (!groupId) throw new Error("Grupo da ata ausente.");
    if (authorization.kind === "public_ata_link") {
      const token = String(authorization.token || "");
      const groups = readRows(spreadsheetId, "grupos!A:P");
      const headers = groups[0] || [];
      const groupCol = headers.indexOf("grupo_id");
      const activeCol = headers.indexOf("ativo");
      const tokenCol = headers.indexOf("link_formulario_ata");
      const validLink = groupCol >= 0 && activeCol >= 0 && tokenCol >= 0 && groups.slice(1).some((row) =>
        row[groupCol] === groupId && isTrue(row[activeCol]) && String(row[tokenCol] || "") === token,
      );
      if (!token || !validLink) throw new Error("Link público inválido, revogado ou fora do grupo da ata.");
      validateAtaCreationRows(spreadsheetId, payload, sheetIds, groupId);
      return;
    }
    validateAuthenticatedGroupAccess(spreadsheetId, authorization, payload.actor, groupId);
    validateAtaCreationRows(spreadsheetId, payload, sheetIds, groupId);
    return;
  }

  if (operation.tipo === "salvar_usuario_grupo") {
    if (authorization.kind === "authenticated") {
      const groupId = String(payload.intent && payload.intent.grupo_id || "");
      validateAdmin(spreadsheetId, authorization, payload.actor);
      if (!groupId) throw new Error("Grupo do usuário ausente.");
      validateGroupExists(spreadsheetId, groupId, false);
      validateAdminUserTarget(spreadsheetId, payload, sheetIds, groupId);
      return;
    }
    validateUserCapability(spreadsheetId, authorization, payload, sheetIds);
    return;
  }

  if (operation.tipo === "simular_atas_mensais" && authorization.kind === "operational_simulation") {
    const groupId = String(payload.intent && payload.intent.grupo_id || "");
    validateGroupExists(spreadsheetId, groupId, true);
    validateSimulationWriteTarget(spreadsheetId, operation, payload, sheetIds, groupId);
    return;
  }

  if (operation.tipo === "salvar_grupo" || operation.tipo === "salvar_horario_grupo" ||
      operation.tipo === "salvar_equipe_mesa_grupo" || operation.tipo === "salvar_servidor_mesa_grupo" ||
      operation.tipo === "desativar_servidor_mesa_grupo" || operation.tipo === "excluir_horarios_grupo") {
    const groupId = String(payload.intent && payload.intent.grupo_id || "");
    if (!groupId) throw new Error("Grupo da operação ausente.");
    if (authorization.kind === "operational_link_repair" && operation.tipo === "salvar_grupo") {
      validateOperationalLinkRepair(spreadsheetId, payload, sheetIds, groupId);
      return;
    }
    const isAdmin = validateAuthenticatedGroupAccess(spreadsheetId, authorization, payload.actor, groupId, operation.tipo === "salvar_grupo");
    validateGroupWriteTarget(spreadsheetId, payload, sheetIds, groupId, isAdmin);
    return;
  }
  throw new Error("Tipo de operação sem política de autorização.");
}

function validateAtaCreationRows(spreadsheetId, payload, sheetIds, groupId) {
  const ataRequest = (payload.requests || []).find((request) => request && request.updateCells && request.updateCells.range.sheetId === sheetIds.atas);
  const update = ataRequest && ataRequest.updateCells;
  const ataHeaders = readRows(spreadsheetId, "atas!A:AD")[0] || [];
  const groupColumn = ataHeaders.indexOf("grupo_id");
  const ataIdColumn = ataHeaders.indexOf("ata_id");
  if (!update || groupColumn < 0 || ataIdColumn < 0 || !update.rows || !update.rows.length ||
      update.rows.length !== 1 || update.rows[0].values[groupColumn]?.userEnteredValue?.stringValue !== groupId ||
      update.rows[0].values[ataIdColumn]?.userEnteredValue?.stringValue !== String(payload.intent.ata_id || "")) {
    throw new Error("As linhas da criação não correspondem ao grupo autorizado.");
  }
  (payload.requests || []).forEach((request) => {
    const dependent = request && request.updateCells;
    if (!dependent || dependent === update) return;
    const sheetName = Object.keys(sheetIds).find((name) => sheetIds[name] === dependent.range.sheetId);
    if (["servidores", "participacao", "visitantes", "ingressos", "trocas_chaveiro"].includes(sheetName)) {
      const headers = readRows(spreadsheetId, `${sheetName}!A:Z`)[0] || [];
      const ataCol = headers.indexOf("ata_id");
      if (ataCol < 0 || !dependent.rows || dependent.rows.some((row) => row.values[ataCol]?.userEnteredValue?.stringValue !== String(payload.intent.ata_id || ""))) {
        throw new Error("Os registros dependentes não correspondem à ata autorizada.");
      }
    }
  });
}

function validateSimulationWriteTarget(spreadsheetId, operation, payload, sheetIds, groupId) {
  const relatedSheets = new Set(["servidores", "participacao", "visitantes", "ingressos", "trocas_chaveiro"]);
  const requests = payload.requests || [];
  const ataRequests = requests.filter((request) =>
    request && request.updateCells && request.updateCells.range.sheetId === sheetIds.atas,
  );
  const ataHeaders = readRows(spreadsheetId, "atas!A:AD")[0] || [];
  const ataIdColumn = ataHeaders.indexOf("ata_id");
  const groupColumn = ataHeaders.indexOf("grupo_id");
  if (ataIdColumn < 0 || groupColumn < 0 || ataRequests.length !== 1) {
    throw new Error("A simulação deve gravar uma única seleção de atas identificada.");
  }
  const ataUpdate = ataRequests[0].updateCells;
  const ataRows = ataUpdate.rows || [];
  if (ataRows.length !== operation.quantidade_atas || ataRows.length < 1 || ataRows.length > MAX_ATAS_PER_OPERATION) {
    throw new Error("A quantidade de atas da simulação não corresponde ao pedido.");
  }
  const ataIds = new Set();
  ataRows.forEach((row) => {
    const startColumn = ataUpdate.range.startColumnIndex || 0;
    const ataId = String(row.values?.[ataIdColumn - startColumn]?.userEnteredValue?.stringValue || "");
    const rowGroupId = String(row.values?.[groupColumn - startColumn]?.userEnteredValue?.stringValue || "");
    if (!ataId || rowGroupId !== groupId || ataIds.has(ataId)) {
      throw new Error("A simulação contém ata fora do grupo autorizado ou ID duplicado.");
    }
    ataIds.add(ataId);
  });

  requests.forEach((request) => {
    if (request && request.appendDimension) {
      const title = Object.keys(sheetIds).find((name) => sheetIds[name] === request.appendDimension.sheetId);
      if (title !== "atas" && !relatedSheets.has(title)) {
        throw new Error("A simulação tentou expandir uma aba fora do conjunto de registros.");
      }
      return;
    }
    if (!request || !request.updateCells) {
      throw new Error("A simulação contém uma mutação fora do conjunto de registros de ata.");
    }
    const title = Object.keys(sheetIds).find((name) => name === "atas"
      ? sheetIds[name] === request.updateCells.range.sheetId
      : relatedSheets.has(name) && sheetIds[name] === request.updateCells.range.sheetId);
    if (title === "atas") return;
    if (!title || !relatedSheets.has(title)) {
      throw new Error("A simulação tentou alterar uma aba fora do conjunto de registros de ata.");
    }
    const headers = readRows(spreadsheetId, `${title}!A:Z`)[0] || [];
    const ataColumn = headers.indexOf("ata_id");
    const update = request.updateCells;
    const startColumn = update.range.startColumnIndex || 0;
    if (ataColumn < 0 || ataColumn < startColumn || !update.rows || update.rows.some((row) => {
      const ataId = String(row.values?.[ataColumn - startColumn]?.userEnteredValue?.stringValue || "");
      return !ataIds.has(ataId);
    })) {
      throw new Error("Os registros da simulação não correspondem às atas do grupo autorizado.");
    }
  });
}

function validateGroupWriteTarget(spreadsheetId, payload, sheetIds, groupId, isAdmin) {
  const groupRanges = { grupos: "grupos!A:P", grupo_horarios: "grupo_horarios!A:K", grupo_servidores_mesa: "grupo_servidores_mesa!A:I" };
  const targets = (payload.requests || []).map((request) => {
    const update = request && request.updateCells;
    if (update && Object.values(sheetIds).includes(update.range.sheetId)) {
      const sheetName = Object.keys(sheetIds).find((name) => sheetIds[name] === update.range.sheetId);
      if (!groupRanges[sheetName]) return true;
      const current = readRows(spreadsheetId, groupRanges[sheetName]);
      const headers = current[0] || [];
      const col = headers.indexOf("grupo_id");
      if (col < 0) return false;
      return (update.rows || []).every((row, index) => {
        const rowIndex = update.range.startRowIndex + index;
        const values = row.values || [];
        if (values[col]?.userEnteredValue?.stringValue !== groupId) return false;
        const existing = current[rowIndex];
        if (existing && existing[col] && existing[col] !== groupId) return false;
        if (sheetName === "grupos" && !isAdmin && (!existing || existing[col] !== groupId)) return false;
        if (sheetName === "grupos" && existing && !isAdmin) {
          const allowed = new Set(["grupo_nome", "fuso_horario", "plataforma", "acesso_plataforma", "link_formulario_ata", "updated_at"]);
          if (!unchangedOutsideColumns(headers, existing, values, update.range.startColumnIndex || 0, allowed)) return false;
        }
        return true;
      });
    }
    const deletion = request && request.deleteDimension;
    if (deletion) {
      const sheetName = Object.keys(sheetIds).find((name) => sheetIds[name] === deletion.range.sheetId);
      if (!groupRanges[sheetName]) return true;
      const headers = readRows(spreadsheetId, groupRanges[sheetName]);
      const col = (headers[0] || []).indexOf("grupo_id");
      return col >= 0 && headers.slice(deletion.range.startIndex, deletion.range.endIndex)
        .every((row) => row[col] === groupId);
    }
    return true;
  });
  if (targets.some((valid) => !valid)) throw new Error("A gravação não corresponde ao grupo autorizado.");
}

function validateOperationalLinkRepair(spreadsheetId, payload, sheetIds, groupId) {
  const rows = readRows(spreadsheetId, "grupos!A:P");
  const headers = rows[0] || [];
  const groupColumn = headers.indexOf("grupo_id");
  const linkColumn = headers.indexOf("link_formulario_ata");
  const currentIndex = rows.findIndex((row, index) => index > 0 && row[groupColumn] === groupId);
  const update = (payload.requests || []).find((request) => request && request.updateCells && request.updateCells.range.sheetId === sheetIds.grupos)?.updateCells;
  const intendedLink = update?.rows?.[0]?.values?.[linkColumn]?.userEnteredValue?.stringValue;
  const allowed = new Set(["link_formulario_ata", "updated_at"]);
  if (currentIndex < 1 || linkColumn < 0 || isSecureToken(rows[currentIndex][linkColumn]) || !isSecureToken(intendedLink) ||
      update.range.startRowIndex !== currentIndex || update.range.endRowIndex !== currentIndex + 1) {
    throw new Error("Reparo operacional de link fora do escopo.");
  }
  if (!unchangedOutsideColumns(headers, rows[currentIndex], update.rows[0].values, update.range.startColumnIndex || 0, allowed)) throw new Error("Reparo de link tentou alterar dados fora do escopo.");
}

function unchangedOutsideColumns(headers, current, nextCells, startColumn, allowed) {
  return nextCells.every((cell, offset) => {
    const index = startColumn + offset;
    if (allowed.has(headers[index])) return true;
    const next = cell && cell.userEnteredValue;
    const value = next && Object.prototype.hasOwnProperty.call(next, "stringValue") ? next.stringValue
      : next && Object.prototype.hasOwnProperty.call(next, "numberValue") ? next.numberValue
        : next && Object.prototype.hasOwnProperty.call(next, "boolValue") ? next.boolValue
          : "";
    return String(current[index] == null ? "" : current[index]) === String(value == null ? "" : value);
  });
}

function validateUserCapability(spreadsheetId, authorization, payload, sheetIds) {
  const capabilities = new Set(["activation_token", "password_reset_token", "validated_login", "password_recovery"]);
  const userId = String(payload.intent && payload.intent.usuario_id || "");
  if (!capabilities.has(String(authorization.kind || "")) || !userId || authorization.usuario_id !== userId) {
    throw new Error("Capacidade de usuário inválida.");
  }
  if (["activation_token", "password_reset_token"].includes(authorization.kind) && !String(authorization.token || "")) {
    throw new Error("Token de capacidade ausente.");
  }
  const rows = readRows(spreadsheetId, "usuarios_grupo!A:K");
  const headers = rows[0] || [];
  const idCol = headers.indexOf("usuario_id");
  const statusCol = headers.indexOf("status");
  const groupCol = headers.indexOf("grupo_id");
  const tokenCol = headers.indexOf("convite_token");
  const currentIndex = rows.findIndex((row, index) => index > 0 && row[idCol] === userId);
  const current = currentIndex > 0 ? rows[currentIndex] : undefined;
  const request = (payload.requests || []).find((item) => item && item.updateCells && item.updateCells.range.sheetId === sheetIds.usuarios_grupo)?.updateCells;
  const next = request?.rows?.[0]?.values?.map((cell) => cell?.userEnteredValue?.stringValue ?? "");
  if (!current || !request || request.range.startRowIndex !== currentIndex || request.range.endRowIndex !== currentIndex + 1 || !next || next[idCol] !== userId || String(payload.intent.grupo_id || "") !== String(current[groupCol] || "") || next[groupCol] !== current[groupCol]) {
    throw new Error("A alteração de usuário não corresponde à linha autorizada.");
  }
  if (authorization.kind === "activation_token") {
    const expiryCol = headers.indexOf("convite_expira_em");
    const expiration = new Date(current[expiryCol]).getTime();
    if (current[statusCol] !== "pendente" || current[tokenCol] !== authorization.token || !Number.isFinite(expiration) || expiration < Date.now() || next[statusCol] !== "ativo" || next[tokenCol] !== "") throw new Error("Convite de ativação inválido ou consumido.");
    assertOnlyUserColumnsChanged(headers, current, next, ["senha_hash", "status", "convite_token", "convite_expira_em", "updated_at"]);
  } else if (authorization.kind === "password_reset_token") {
    const expiryCol = headers.indexOf("convite_expira_em");
    const expiration = new Date(current[expiryCol]).getTime();
    if (current[statusCol] !== "ativo" || current[tokenCol] !== authorization.token || !Number.isFinite(expiration) || expiration < Date.now() || next[statusCol] !== "ativo" || next[tokenCol] !== "") throw new Error("Token de recuperação inválido ou consumido.");
    assertOnlyUserColumnsChanged(headers, current, next, ["senha_hash", "status", "convite_token", "convite_expira_em", "updated_at"]);
  } else if (authorization.kind === "validated_login") {
    if (current[statusCol] !== "ativo" || headers.indexOf("ultimo_login") < 0) throw new Error("Sessão de login não confirmada.");
    assertOnlyUserColumnsChanged(headers, current, next, ["ultimo_login", "updated_at"]);
  } else if (authorization.kind === "password_recovery") {
    if (current[statusCol] !== "ativo" || next[tokenCol] === current[tokenCol] || !next[tokenCol]) throw new Error("Solicitação de recuperação inválida.");
    assertOnlyUserColumnsChanged(headers, current, next, ["convite_token", "convite_expira_em", "updated_at"]);
  }
}

function validateAdminUserTarget(spreadsheetId, payload, sheetIds, groupId) {
  const rows = readRows(spreadsheetId, "usuarios_grupo!A:K");
  const headers = rows[0] || [];
  const idCol = headers.indexOf("usuario_id");
  const groupCol = headers.indexOf("grupo_id");
  const userId = String(payload.intent && payload.intent.usuario_id || "");
  const currentIndex = rows.findIndex((row, index) => index > 0 && row[idCol] === userId);
  const request = (payload.requests || []).find((item) => item && item.updateCells && item.updateCells.range.sheetId === sheetIds.usuarios_grupo)?.updateCells;
  const next = request?.rows?.[0]?.values?.map((cell) => cell?.userEnteredValue?.stringValue ?? "");
  if (!userId || !request || request.range.startRowIndex !== (currentIndex > 0 ? currentIndex : request.range.startRowIndex) ||
      !next || next[idCol] !== userId || next[groupCol] !== groupId || (currentIndex > 0 && rows[currentIndex][groupCol] !== groupId)) {
    throw new Error("A sincronização não corresponde ao usuário e grupo autorizados.");
  }
}

function assertOnlyUserColumnsChanged(headers, current, next, allowed) {
  if (headers.some((header, index) => !allowed.includes(header) && String(current[index] || "") !== String(next[index] || ""))) {
    throw new Error("A capacidade não permite alterar os demais campos do usuário.");
  }
}

function validateAuthenticatedGroupAccess(spreadsheetId, authorization, actor, groupId, allowCreate) {
  const email = normalizeEmail(authorization.email);
  if (!email || normalizeEmail(actor) !== email) throw new Error("E-mail autenticado inválido.");
  const admins = String(PropertiesService.getScriptProperties().getProperty("GATEWAY_ADMIN_EMAILS") || "")
    .split(/[\\s,;]+/).map(normalizeEmail).filter(Boolean);
  if (admins.includes(email)) {
    if (!allowCreate) validateGroupExists(spreadsheetId, groupId, true);
    return true;
  }
  validateGroupExists(spreadsheetId, groupId, true);
  const users = readRows(spreadsheetId, "usuarios_grupo!A:K");
  const headers = users[0] || [];
  const groupCol = headers.indexOf("grupo_id");
  const emailCol = headers.indexOf("email");
  const statusCol = headers.indexOf("status");
  if (groupCol < 0 || emailCol < 0 || statusCol < 0 || !users.slice(1).some((row) =>
    row[groupCol] === groupId && normalizeEmail(row[emailCol]) === email && String(row[statusCol] || "").toLowerCase() === "ativo",
  )) throw new Error("Usuário sem vínculo ativo com o grupo.");
  return false;
}

function validateAdmin(spreadsheetId, authorization, actor) {
  const email = normalizeEmail(authorization.email);
  if (!email || normalizeEmail(actor) !== email) throw new Error("E-mail autenticado inválido.");
  const admins = String(PropertiesService.getScriptProperties().getProperty("GATEWAY_ADMIN_EMAILS") || "")
    .split(/[\\s,;]+/).map(normalizeEmail).filter(Boolean);
  if (!admins.includes(email)) throw new Error("Operação requer administrador configurado.");
}

function validateGroupExists(spreadsheetId, groupId, requireActive) {
  const groups = readRows(spreadsheetId, "grupos!A:P");
  const headers = groups[0] || [];
  const idCol = headers.indexOf("grupo_id");
  const activeCol = headers.indexOf("ativo");
  if (idCol < 0 || (requireActive && activeCol < 0) || !groups.slice(1).some((row) =>
    row[idCol] === groupId && (!requireActive || isTrue(row[activeCol])),
  )) throw new Error("Grupo inativo ou inexistente.");
}

function readRows(spreadsheetId, range) {
  return Sheets.Spreadsheets.Values.get(spreadsheetId, range, { valueRenderOption: "UNFORMATTED_VALUE" }).values || [];
}

function normalizeEmail(value) { return String(value || "").trim().toLocaleLowerCase("en-US"); }
function isTrue(value) { return value === true || String(value).toLowerCase() === "true"; }
function isSecureToken(value) { return typeof value === "string" && /^[A-Za-z0-9_-]{40,}$/.test(value); }

function validateAtaIndexAuthorization(spreadsheetId, operation, payload, sheetIds) {
  const email = String(payload.actor || "").trim().toLocaleLowerCase("en-US");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("A alteração do índice exige e-mail autenticado.");
  }
  if (String(payload.intent && payload.intent.ata_id || "") === "") {
    throw new Error("Ata da alteração de índice ausente.");
  }

  const ataRows = Sheets.Spreadsheets.Values.get(spreadsheetId, "atas!A:AD", {
    valueRenderOption: "UNFORMATTED_VALUE",
  }).values || [];
  const ataHeaders = ataRows[0] || [];
  const ataIdColumn = ataHeaders.indexOf("ata_id");
  const groupIdColumn = ataHeaders.indexOf("grupo_id");
  if (ataIdColumn < 0 || groupIdColumn < 0) throw new Error("Cabeçalho da aba atas inválido.");
  const currentAtaIndex = ataRows.findIndex((row, index) => index > 0 && row[ataIdColumn] === payload.intent.ata_id);
  const currentAta = currentAtaIndex >= 0 ? ataRows[currentAtaIndex] : undefined;
  if (!currentAta) throw new Error("Ata não encontrada para validar autorização.");
  const groupId = String(currentAta[groupIdColumn] || "");
  if (!groupId) throw new Error("Grupo da ata ausente.");

  const update = (payload.requests || []).find((request) => request && request.updateCells);
  const updatedCells = update && update.updateCells.rows && update.updateCells.rows[0] && update.updateCells.rows[0].values;
  const updateRange = update && update.updateCells.range;
  if (!updatedCells || !updateRange || updateRange.sheetId !== sheetIds.atas || updateRange.startRowIndex !== currentAtaIndex || updateRange.endRowIndex !== currentAtaIndex + 1 || updatedCells[ataIdColumn]?.userEnteredValue?.stringValue !== payload.intent.ata_id || updatedCells[groupIdColumn]?.userEnteredValue?.stringValue !== groupId) {
    throw new Error("A alteração não corresponde à ata e ao grupo autorizados.");
  }

  const adminEmails = String(PropertiesService.getScriptProperties().getProperty("GATEWAY_ADMIN_EMAILS") || "")
    .split(/[\s,;]+/)
    .map((value) => value.trim().toLocaleLowerCase("en-US"))
    .filter(Boolean);
  if (adminEmails.includes(email)) return;

  const groups = Sheets.Spreadsheets.Values.get(spreadsheetId, "grupos!A:P", {
    valueRenderOption: "UNFORMATTED_VALUE",
  }).values || [];
  const groupHeaders = groups[0] || [];
  const groupsIdColumn = groupHeaders.indexOf("grupo_id");
  const activeGroupColumn = groupHeaders.indexOf("ativo");
  if (groupsIdColumn < 0 || activeGroupColumn < 0) throw new Error("Cabeçalho da aba grupos inválido.");
  const activeGroup = groups.slice(1).some((row) => row[groupsIdColumn] === groupId && (row[activeGroupColumn] === true || String(row[activeGroupColumn]).toLowerCase() === "true"));
  if (!activeGroup) throw new Error("Grupo inativo ou inexistente.");

  const users = Sheets.Spreadsheets.Values.get(spreadsheetId, "usuarios_grupo!A:K", {
    valueRenderOption: "UNFORMATTED_VALUE",
  }).values || [];
  const userHeaders = users[0] || [];
  const userGroupColumn = userHeaders.indexOf("grupo_id");
  const userEmailColumn = userHeaders.indexOf("email");
  const userStatusColumn = userHeaders.indexOf("status");
  if (userGroupColumn < 0 || userEmailColumn < 0 || userStatusColumn < 0) throw new Error("Cabeçalho da aba usuarios_grupo inválido.");
  const activeResponsible = users.slice(1).some((row) =>
    row[userGroupColumn] === groupId &&
    String(row[userEmailColumn] || "").trim().toLocaleLowerCase("en-US") === email &&
    String(row[userStatusColumn] || "").trim().toLocaleLowerCase("en-US") === "ativo",
  );
  if (!activeResponsible) throw new Error("Usuário sem permissão ativa para este grupo.");
}

function handleOperationStatus(body) {
  const properties = PropertiesService.getScriptProperties();
  const secret = properties.getProperty("GATEWAY_HMAC_SECRET");
  const spreadsheetId = properties.getProperty("SPREADSHEET_ID");
  if (!secret || !spreadsheetId) throw new Error("Gateway não configurado.");
  const query = body.query;
  if (!query || typeof query !== "object") throw new Error("Consulta de operação ausente.");
  verifySignedValue(body, query, secret);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(query.operacao_id || ""))) {
    throw new Error("operacao_id inválido.");
  }
  if (!/^[0-9a-f]{64}$/i.test(String(query.hash_solicitacao || ""))) {
    throw new Error("Hash da operação inválido.");
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return { ok: true, state: "indeterminada", safe_to_retry: false };
  }
  try {
    const ledgerValues = Sheets.Spreadsheets.Values.get(spreadsheetId, "operacoes!A:H").values || [];
    if (!sameArray(ledgerValues[0] || [], OPERATION_HEADERS)) throw new Error("Cabeçalho do ledger inválido.");
    const matches = ledgerValues.filter((row, index) => index > 0 && row[0] === query.operacao_id);
    if (matches.length > 1) return { ok: true, state: "indeterminada", safe_to_retry: false };
    if (matches.length === 0) {
      return { ok: true, state: "nao_encontrada", safe_to_retry: false };
    }
    const previous = matches[0];
    if (previous[1] !== query.hash_solicitacao) {
      return { ok: true, state: "conflito", safe_to_retry: false };
    }
    if (previous[4] !== "concluida") {
      return { ok: true, state: "indeterminada", safe_to_retry: false };
    }
    return {
      ok: true,
      state: "aplicada",
      safe_to_retry: false,
      resultado_ref: previous[7] || query.operacao_id,
    };
  } finally {
    lock.releaseLock();
  }
}

function verifySignedValue(body, value, secret) {
  if (!Number.isSafeInteger(body.timestamp) || Math.abs(Date.now() - body.timestamp) > MAX_CLOCK_SKEW_MS) {
    throw new Error("Timestamp ausente ou expirado.");
  }
  const expectedSignature = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(
      `${body.timestamp}.${canonicalJson(value)}`,
      secret,
    ),
  ).replace(/=+$/, "");
  if (!constantTimeEqual(expectedSignature, String(body.signature || ""))) {
    throw new Error("Assinatura inválida.");
  }
}

function validatePayload(payload) {
  if (!payload || typeof payload.actor !== "string" || !payload.actor.trim()) throw new Error("Ator ausente.");
  if (typeof payload.intent === "undefined") throw new Error("Intenção idempotente ausente.");
  if (!Array.isArray(payload.requests) || payload.requests.length === 0) throw new Error("Lote vazio.");
  if (!Array.isArray(payload.guards) || payload.guards.length === 0) throw new Error("Guard de leitura ausente.");
}

function validateGuards(spreadsheetId, guards) {
  for (const guard of guards) {
    if (!isAllowedRange(guard.range)) throw new Error("Intervalo de guard fora do contrato.");
    const values = Sheets.Spreadsheets.Values.get(spreadsheetId, guard.range, {
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "SERIAL_NUMBER",
    }).values || [];
    if (sha256Hex(canonicalJson(values)) !== guard.sha256) throw new Error("Leitura ficou desatualizada; recarregue e tente novamente.");
  }
}

function validateAndPrepareRequest(request, ids) {
  if (request.updateCells) {
    const target = request.updateCells.range || {};
    const title = Object.keys(ids).find((name) => ids[name] === target.sheetId);
    if (!title || !CONTRACT_SHEETS.has(title) || title === "operacoes") throw new Error("Aba de destino não permitida.");
    if (request.updateCells.fields !== "userEnteredValue") throw new Error("Máscara de campos não permitida.");
    const maxColumns = SHEET_COLUMN_LIMITS[title];
    const startRow = target.startRowIndex;
    const endRow = target.endRowIndex;
    const startColumn = target.startColumnIndex;
    const endColumn = target.endColumnIndex;
    const rows = request.updateCells.rows;
    if (!Number.isInteger(startRow) || startRow < 1 || !Number.isInteger(endRow) || endRow <= startRow || endRow - startRow > 1000) throw new Error("Linhas de destino fora do contrato.");
    if (startColumn !== 0 || !Number.isInteger(endColumn) || endColumn < 1 || endColumn > maxColumns) throw new Error("Colunas de destino fora do contrato.");
    if (!Array.isArray(rows) || rows.length !== endRow - startRow) throw new Error("Conteúdo de atualização incompatível com o intervalo.");
    rows.forEach((row) => {
      if (!row || !Array.isArray(row.values) || row.values.length !== endColumn) throw new Error("Largura de linha inválida.");
      row.values.forEach((cell) => {
        const value = cell && cell.userEnteredValue;
        if (!value || Object.keys(value).length !== 1 || !["stringValue", "numberValue", "boolValue"].includes(Object.keys(value)[0])) throw new Error("Valor de célula fora do contrato.");
      });
    });
    return {
      updateCells: {
        range: {
          sheetId: target.sheetId,
          startRowIndex: startRow,
          endRowIndex: endRow,
          startColumnIndex: startColumn,
          endColumnIndex: endColumn,
        },
        rows: rows.map((row) => ({
          values: row.values.map((cell) => ({
            userEnteredValue: cell.userEnteredValue,
          })),
        })),
        fields: "userEnteredValue",
      },
    };
  }
  if (request.deleteDimension) {
    const range = request.deleteDimension.range || {};
    const title = Object.keys(ids).find((name) => ids[name] === range.sheetId);
    if (title !== "grupo_horarios" || range.dimension !== "ROWS" || !Number.isInteger(range.startIndex) || range.startIndex < 1 || !Number.isInteger(range.endIndex) || range.endIndex - range.startIndex !== 1) {
      throw new Error("Exclusão fora da política do gateway.");
    }
    return {
      deleteDimension: {
        range: {
          sheetId: range.sheetId,
          dimension: "ROWS",
          startIndex: range.startIndex,
          endIndex: range.endIndex,
        },
      },
    };
  }
  if (request.appendDimension) {
    const append = request.appendDimension;
    const title = Object.keys(ids).find((name) => ids[name] === append.sheetId);
    if (
      !title ||
      !CONTRACT_SHEETS.has(title) ||
      title === "operacoes" ||
      append.dimension !== "ROWS" ||
      !Number.isInteger(append.length) ||
      append.length < 1 ||
      append.length > 1000
    ) {
      throw new Error("Expansão de grade fora da política do gateway.");
    }
    return {
      appendDimension: {
        sheetId: append.sheetId,
        dimension: "ROWS",
        length: append.length,
      },
    };
  }
  throw new Error("Tipo de suboperação não permitido.");
}

function isAllowedRange(range) {
  if (typeof range !== "string") return false;
  const title = range.split("!")[0];
  if (!CONTRACT_SHEETS.has(title) || title === "operacoes" || !/^[A-Za-z0-9_À-ÿ ]+![A-Z]+(?::[A-Z]+|\d+(?::[A-Z]+\d+)?)$/.test(range)) return false;
  const columnMatch = range.match(/!([A-Z]+)(?::([A-Z]+|\d+))?/);
  const firstColumn = columnMatch && columnNumber(columnMatch[1]);
  const lastColumn = columnMatch && columnNumber((columnMatch[2] || columnMatch[1]).replace(/\d+$/, "") || columnMatch[1]);
  return Boolean(firstColumn && lastColumn && firstColumn >= 1 && lastColumn >= firstColumn && lastColumn <= (SHEET_COLUMN_LIMITS[title] || 0));
}

function columnNumber(column) {
  return column.split("").reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256Hex(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value)
    .map((byte) => (byte + 256).toString(16).slice(-2))
    .join("");
}

function constantTimeEqual(first, second) {
  if (first.length !== second.length) return false;
  let difference = 0;
  for (let index = 0; index < first.length; index += 1) difference |= first.charCodeAt(index) ^ second.charCodeAt(index);
  return difference === 0;
}

function sameArray(first, second) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function jsonOutput(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
