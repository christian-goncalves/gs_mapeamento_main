import { describe, expect, it } from "vitest";
import { SHEET_HEADERS } from "./contract";
import {
  ATA_RECORD_SHEETS,
  assertAtaRecordHeaders,
  buildClearAtaRecordRequests,
  type ResetSheetMetadata,
} from "./reset-ata-records";

const metadata: ResetSheetMetadata[] = [
  { title: "grupos", sheetId: 1, rowCount: 100 },
  { title: "usuarios_grupo", sheetId: 2, rowCount: 100 },
  { title: "grupo_horarios", sheetId: 3, rowCount: 100 },
  { title: "Página7", sheetId: 4, rowCount: 100 },
  { title: "atas", sheetId: 10, rowCount: 30 },
  { title: "servidores", sheetId: 11, rowCount: 30 },
  { title: "participacao", sheetId: 12, rowCount: 30 },
  { title: "visitantes", sheetId: 13, rowCount: 30 },
  { title: "trocas_chaveiro", sheetId: 14, rowCount: 30 },
  { title: "ingressos", sheetId: 15, rowCount: 30 },
];

describe("reset seguro das abas de registros da ata", () => {
  it("gera limpeza apenas das seis abas permitidas", () => {
    const requests = buildClearAtaRecordRequests(metadata);

    expect(requests).toHaveLength(ATA_RECORD_SHEETS.length);
    expect(requests.map((request) => request.repeatCell?.range?.sheetId)).toEqual([
      10, 11, 12, 13, 14, 15,
    ]);
    expect(
      requests.every((request) => request.repeatCell?.fields === "userEnteredValue"),
    ).toBe(true);
    expect(
      requests.some((request) => "deleteDimension" in request),
    ).toBe(false);
  });

  it("limpa a partir da linha 2 preservando cabeçalho e configurações", () => {
    const [atasRequest] = buildClearAtaRecordRequests(metadata);

    expect(atasRequest.repeatCell?.range).toEqual({
      sheetId: 10,
      startRowIndex: 1,
      endRowIndex: 30,
      startColumnIndex: 0,
      endColumnIndex: SHEET_HEADERS.atas.length,
    });
    expect(atasRequest.repeatCell?.cell).toEqual({});
  });

  it("falha quando uma aba alvo está ausente", () => {
    expect(() =>
      buildClearAtaRecordRequests(
        metadata.filter((sheet) => sheet.title !== "visitantes"),
      ),
    ).toThrow("Aba obrigatória ausente: visitantes");
  });

  it("valida cabeçalhos das abas alvo", () => {
    assertAtaRecordHeaders({
      atas: [...SHEET_HEADERS.atas],
      servidores: [...SHEET_HEADERS.servidores],
      participacao: [...SHEET_HEADERS.participacao],
      visitantes: [...SHEET_HEADERS.visitantes],
      trocas_chaveiro: [...SHEET_HEADERS.trocas_chaveiro],
      ingressos: [...SHEET_HEADERS.ingressos],
    });

    expect(() =>
      assertAtaRecordHeaders({
        atas: ["ata_id"],
        servidores: [...SHEET_HEADERS.servidores],
        participacao: [...SHEET_HEADERS.participacao],
        visitantes: [...SHEET_HEADERS.visitantes],
        trocas_chaveiro: [...SHEET_HEADERS.trocas_chaveiro],
        ingressos: [...SHEET_HEADERS.ingressos],
      }),
    ).toThrow("Cabeçalho inválido em atas");
  });
});
