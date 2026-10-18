import "server-only";

import { canAccessGroup, resolveAccessByEmailFromAggregated } from "@/lib/auth/access";
import type { AggregatedRead } from "@/domain/aggregate";
import { readAggregatedAtas, listAtas } from "./repository";
import { compatibleHeaders, sheetReadRange } from "./contract-v2";
import { getSheetsClient, getSpreadsheetId } from "./client";
import { executeAtomicBatch } from "./write";

export type AtaApprovalSelection = { ataId: string; updatedAt: string };

const MAX_APPROVALS = 50;
const MAX_APPROVAL_PAYLOAD_BYTES = 1_572_864;

function cellUpdate(sheetId: number, rowNumber: number, column: number, value: string) {
  return {
    updateCells: {
      range: {
        sheetId,
        startRowIndex: rowNumber - 1,
        endRowIndex: rowNumber,
        startColumnIndex: column,
        endColumnIndex: column + 1,
      },
      rows: [{ values: [{ userEnteredValue: { stringValue: value } }] }],
      fields: "userEnteredValue",
    },
  };
}

function selectionError(items: { ataId: string; reason: string }[]) {
  const details = items.map((item) => `${item.ataId} (${item.reason})`).join("; ");
  return `Aprovação cancelada sem gravar o lote. Itens inválidos: ${details}.`;
}

export async function approveAtasInSheets(
  selection: AtaApprovalSelection[],
  actorEmail: string,
  identity: { now?: () => string; read?: () => Promise<AggregatedRead> } = {},
) {
  if (!actorEmail.trim()) throw new Error("Sessão inválida para aprovar atas.");
  if (!Array.isArray(selection) || selection.length < 1 || selection.length > MAX_APPROVALS) {
    throw new Error(`Selecione entre 1 e ${MAX_APPROVALS} atas para aprovar.`);
  }
  const uniqueIds = new Set(selection.map((item) => item.ataId));
  if (uniqueIds.size !== selection.length || selection.some((item) => !item.ataId || !item.updatedAt)) {
    throw new Error("A seleção contém identificadores ou versões inválidas.");
  }

  const read = identity.read ?? readAggregatedAtas;
  const [aggregate, ataRows] = await Promise.all([read(), listAtas()]);
  const access = await resolveAccessByEmailFromAggregated(actorEmail, aggregate);
  if (!access) throw new Error("Sessão sem permissão para aprovar atas.");

  const validRows = ataRows.filter((row) => row.valid);
  const candidates = selection.map((requested) => {
    const row = validRows.find((candidate) => candidate.data.ata_id === requested.ataId);
    const reason = !row
      ? "não encontrada ou inválida"
      : !canAccessGroup(access, row.data.grupo_id)
        ? "sem autorização para este grupo"
        : row.data.status_registro !== "ativa"
          ? "ata excluída ou substituída"
          : row.data.status_aprovacao !== "pendente_revisao"
            ? "ata já aprovada ou sem pendência"
            : row.data.updated_at !== requested.updatedAt
              ? "ata alterada desde a seleção"
              : "";
    return { requested, row, reason };
  });
  const invalidItems = candidates
    .filter((candidate) => candidate.reason)
    .map((candidate) => ({ ataId: candidate.requested.ataId, reason: candidate.reason }));
  if (invalidItems.length > 0) throw new Error(selectionError(invalidItems));
  const selected = candidates.flatMap((candidate) => candidate.row ? [candidate.row] : []);

  const ataValuesResponse = await getSheetsClient().spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: sheetReadRange("atas"),
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const currentHeaders = (ataValuesResponse.data.values?.[0] ?? []) as unknown[];
  const requiredApprovalHeaders = ["status_registro", "status_aprovacao", "aprovado_por", "aprovado_em"];
  const missingApprovalHeaders = requiredApprovalHeaders.filter((header) => !currentHeaders.includes(header));
  if (missingApprovalHeaders.length > 0) {
    throw new Error(`Contrato de revisão ainda não reconciliado na aba atas. Colunas ausentes: ${missingApprovalHeaders.join(", ")}.`);
  }

  const metadata = await getSheetsClient().spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
    fields: "sheets(properties(sheetId,title))",
  });
  const sheetId = metadata.data.sheets?.find(
    (sheet) => sheet.properties?.title === "atas",
  )?.properties?.sheetId;
  if (typeof sheetId !== "number") throw new Error("ID da aba atas não encontrado.");

  const headers = compatibleHeaders("atas");
  const statusColumn = headers.indexOf("status_aprovacao");
  const approvedByColumn = headers.indexOf("aprovado_por");
  const approvedAtColumn = headers.indexOf("aprovado_em");
  if ([statusColumn, approvedByColumn, approvedAtColumn].some((column) => column < 0)) {
    throw new Error("Cabeçalho de aprovação ausente na aba atas.");
  }
  const now = (identity.now ?? (() => new Date().toISOString()))();
  const requests = selected.flatMap((row) => [
    cellUpdate(sheetId, row.rowNumber, statusColumn, "aprovada"),
    cellUpdate(sheetId, row.rowNumber, approvedByColumn, access.email),
    cellUpdate(sheetId, row.rowNumber, approvedAtColumn, now),
  ]);
  const payloadBytes = new TextEncoder().encode(JSON.stringify(requests)).byteLength;
  if (payloadBytes > MAX_APPROVAL_PAYLOAD_BYTES) {
    throw new Error("A seleção excede 1,5 MiB. Reduza a quantidade de atas.");
  }

  await executeAtomicBatch(getSheetsClient(), getSpreadsheetId(), requests);
  return { approvedIds: selected.map((row) => row.data.ata_id), approvedAt: now };
}
