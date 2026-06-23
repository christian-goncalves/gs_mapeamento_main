import { describe, expect, it, vi } from "vitest";

import { SHEET_HEADERS, type SheetName } from "./contract";
import {
  reconcileSheetContract,
  type ContractReconciliationClient,
} from "./contract-reconciliation";

const existingNames = Object.keys(SHEET_HEADERS).filter(
  (name) => name !== "ingressos",
) as SheetName[];

function metadata(names: SheetName[]) {
  return names.map((name, index) => ({
    properties: {
      title: name,
      sheetId: index + 1,
      gridProperties: { rowCount: 1000 },
    },
  }));
}

function clientWith(options: {
  names?: SheetName[];
  invalidHeader?: Partial<Record<SheetName, unknown[]>>;
  afterCreateIngressos?: boolean;
  afterMigration?: boolean;
} = {}) {
  const names = options.names ?? (Object.keys(SHEET_HEADERS) as SheetName[]);
  let migrated = false;
  const batchUpdate = vi.fn(async () => {
    migrated = true;
  });
  const get = vi.fn(async () => ({ data: { sheets: metadata(names) } }));
  const valuesGet = vi.fn(
    async ({ range }: { spreadsheetId: string; range: string }) => {
      const [sheetName] = range.split("!");
      const name = sheetName as SheetName;
      if (!names.includes(name) && !options.afterCreateIngressos) {
        throw new Error(`Unable to parse range: ${name}!1:1`);
      }
      if (migrated && options.afterMigration) {
        return { data: { values: [[...SHEET_HEADERS[name]]] } };
      }
      return {
        data: {
          values: [
            options.invalidHeader?.[name] ?? [...SHEET_HEADERS[name]],
          ],
        },
      };
    },
  );
  const client = {
    spreadsheets: {
      get,
      values: { get: valuesGet },
      batchUpdate,
    },
  } as unknown as ContractReconciliationClient;
  return { client, batchUpdate, valuesGet };
}

describe("reconciliação do contrato Sheets", () => {
  it("cria ingressos quando a aba está ausente", async () => {
    const { client, batchUpdate } = clientWith({
      names: existingNames,
      afterCreateIngressos: true,
    });

    const result = await reconcileSheetContract(client, "spreadsheet-test");

    expect(result.createdSheets).toEqual(["ingressos"]);
    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    expect(requests).toContainEqual(
      expect.objectContaining({
        addSheet: expect.objectContaining({
          properties: expect.objectContaining({ title: "ingressos" }),
        }),
      }),
    );
    expect(requests).toContainEqual(
      expect.objectContaining({
        updateCells: expect.objectContaining({
          rows: [
            {
              values: SHEET_HEADERS.ingressos.map((header) => ({
                userEnteredValue: { stringValue: header },
              })),
            },
          ],
        }),
      }),
    );
  });

  it("não duplica ingressos quando a aba já existe", async () => {
    const { client, batchUpdate } = clientWith();

    const result = await reconcileSheetContract(client, "spreadsheet-test");

    expect(result.createdSheets).toEqual([]);
    expect(
      batchUpdate.mock.calls[0][0].requestBody.requests.some(
        (request: object) => "addSheet" in request,
      ),
    ).toBe(false);
  });

  it("falha sem mutar quando ingressos existe com cabeçalho divergente", async () => {
    const { client, batchUpdate } = clientWith({
      invalidHeader: { ingressos: ["nome"] },
    });

    await expect(
      reconcileSheetContract(client, "spreadsheet-test"),
    ).rejects.toThrow("Cabeçalho inválido em ingressos");
    expect(batchUpdate).not.toHaveBeenCalled();
  });

  it("adiciona total_partilhas antes de criar abas quando a coluna está ausente", async () => {
    const { client, batchUpdate } = clientWith({
      names: existingNames,
      afterCreateIngressos: true,
      afterMigration: true,
      invalidHeader: {
        atas: SHEET_HEADERS.atas.filter((header) => header !== "total_partilhas"),
      },
    });

    const result = await reconcileSheetContract(client, "spreadsheet-test");

    expect(result.addedColumns).toContainEqual({
      sheet: "atas",
      column: "total_partilhas",
    });
    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    expect(requests).toContainEqual(
      expect.objectContaining({
        insertDimension: expect.objectContaining({
          range: expect.objectContaining({
            dimension: "COLUMNS",
            startIndex: SHEET_HEADERS.atas.indexOf("total_partilhas"),
          }),
        }),
      }),
    );
  });

  it("adiciona quantidade em trocas_chaveiro quando a coluna está ausente", async () => {
    const { client } = clientWith({
      afterMigration: true,
      invalidHeader: {
        trocas_chaveiro: SHEET_HEADERS.trocas_chaveiro.filter(
          (header) => header !== "quantidade",
        ),
      },
    });

    const result = await reconcileSheetContract(client, "spreadsheet-test");

    expect(result.addedColumns).toContainEqual({
      sheet: "trocas_chaveiro",
      column: "quantidade",
    });
  });

  it("falha sem mutar quando cabeçalho existente tem divergência inesperada", async () => {
    const { client, batchUpdate } = clientWith({
      invalidHeader: { atas: ["ata_id", "campo_inesperado"] },
    });

    await expect(
      reconcileSheetContract(client, "spreadsheet-test"),
    ).rejects.toThrow("Cabeçalho inválido em atas");
    expect(batchUpdate).not.toHaveBeenCalled();
  });
});
