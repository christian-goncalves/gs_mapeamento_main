import { describe, expect, it, vi } from "vitest";

import { tempoLimpoMapping } from "@/domain/enums";
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
  const trocasChaveiroSheetId =
    (Object.keys(SHEET_HEADERS) as SheetName[]).indexOf("trocas_chaveiro") + 1;

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

  it("adiciona preenchido_por em atas quando a coluna está ausente", async () => {
    const { client, batchUpdate } = clientWith({
      afterMigration: true,
      invalidHeader: {
        atas: SHEET_HEADERS.atas.filter((header) => header !== "preenchido_por"),
      },
    });

    const result = await reconcileSheetContract(client, "spreadsheet-test");

    expect(result.addedColumns).toContainEqual({
      sheet: "atas",
      column: "preenchido_por",
    });
    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    expect(requests).toContainEqual(
      expect.objectContaining({
        insertDimension: expect.objectContaining({
          range: expect.objectContaining({
            dimension: "COLUMNS",
            startIndex: SHEET_HEADERS.atas.indexOf("preenchido_por"),
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

  it("adiciona cidade em ingressos quando a coluna está ausente", async () => {
    const { client } = clientWith({
      afterMigration: true,
      invalidHeader: {
        ingressos: SHEET_HEADERS.ingressos.filter(
          (header) => header !== "cidade",
        ),
      },
    });

    const result = await reconcileSheetContract(client, "spreadsheet-test");

    expect(result.addedColumns).toContainEqual({
      sheet: "ingressos",
      column: "cidade",
    });
  });

  it("adiciona os campos de acesso em grupos quando a planilha está no contrato antigo", async () => {
    const newGroupColumns = [
      "responsavel_grupo_nome",
      "responsavel_grupo_email",
      "email_acesso_grupo",
      "responsaveis_ata",
      "link_formulario_ata",
    ];
    const { client, batchUpdate } = clientWith({
      afterMigration: true,
      invalidHeader: {
        grupos: SHEET_HEADERS.grupos.filter(
          (header) => !newGroupColumns.includes(header),
        ),
      },
    });

    const result = await reconcileSheetContract(client, "spreadsheet-test");

    for (const column of newGroupColumns) {
      expect(result.addedColumns).toContainEqual({ sheet: "grupos", column });
    }
    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    expect(requests).toContainEqual(
      expect.objectContaining({
        insertDimension: expect.objectContaining({
          range: expect.objectContaining({
            dimension: "COLUMNS",
            startIndex: SHEET_HEADERS.grupos.indexOf(newGroupColumns[0]),
            endIndex:
              SHEET_HEADERS.grupos.indexOf(newGroupColumns[0]) +
              newGroupColumns.length,
          }),
        }),
      }),
    );
  });

  it("reconcilia validações de trocas_chaveiro com o contrato atual", async () => {
    const { client, batchUpdate } = clientWith();

    await reconcileSheetContract(client, "spreadsheet-test");

    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    expect(requests).toContainEqual(
      expect.objectContaining({
        repeatCell: expect.objectContaining({
          range: expect.objectContaining({
            sheetId: trocasChaveiroSheetId,
            startColumnIndex: 2,
            endColumnIndex: 3,
          }),
          cell: expect.objectContaining({
            dataValidation: expect.objectContaining({
              condition: {
                type: "ONE_OF_LIST",
                values: tempoLimpoMapping.codes.map((userEnteredValue) => ({
                  userEnteredValue,
                })),
              },
              strict: true,
              showCustomUi: true,
            }),
          }),
          fields: "dataValidation",
        }),
      }),
    );
    expect(requests).toContainEqual(
      expect.objectContaining({
        repeatCell: expect.objectContaining({
          range: expect.objectContaining({
            sheetId: trocasChaveiroSheetId,
            startColumnIndex: 3,
            endColumnIndex: 4,
          }),
          cell: expect.objectContaining({
            dataValidation: expect.objectContaining({
              condition: {
                type: "NUMBER_GREATER_THAN_EQ",
                values: [
                  {
                    userEnteredValue: "1",
                  },
                ],
              },
              strict: true,
            }),
          }),
          fields: "dataValidation",
        }),
      }),
    );
  });

  it("remove validação herdada de checkbox das colunas textuais de acesso em grupos", async () => {
    const { client, batchUpdate } = clientWith();

    await reconcileSheetContract(client, "spreadsheet-test");

    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    expect(requests).toContainEqual(
      expect.objectContaining({
        repeatCell: expect.objectContaining({
          range: expect.objectContaining({
            sheetId: 1,
            startColumnIndex: SHEET_HEADERS.grupos.indexOf(
              "responsavel_grupo_nome",
            ),
            endColumnIndex:
              SHEET_HEADERS.grupos.indexOf("link_formulario_ata") + 1,
          }),
          cell: {},
          fields: "dataValidation",
        }),
      }),
    );
  });

  it("não aplica dropdown de tempo limpo na coluna quantidade", async () => {
    const { client, batchUpdate } = clientWith();

    await reconcileSheetContract(client, "spreadsheet-test");

    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    const quantidadeValidation = requests.find(
      (request: { repeatCell?: { range?: { startColumnIndex?: number } } }) =>
        request.repeatCell?.range?.startColumnIndex === 3,
    );
    expect(
      quantidadeValidation?.repeatCell?.cell?.dataValidation?.condition?.type,
    ).toBe("NUMBER_GREATER_THAN_EQ");
    expect(
      quantidadeValidation?.repeatCell?.cell?.dataValidation?.condition?.values,
    ).not.toEqual(
      tempoLimpoMapping.codes.map((userEnteredValue) => ({
        userEnteredValue,
      })),
    );
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
