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
  sheetValues?: Partial<Record<SheetName, unknown[][]>>;
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
      if (range.endsWith("!A:Z") && options.sheetValues?.[name]) {
        return { data: { values: options.sheetValues[name] } };
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

const groupA = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
const groupB = "2bed9d1b-7fea-4cf4-9497-f0ccbcead41c";

function ataRow(overrides: Record<string, unknown> = {}) {
  return SHEET_HEADERS.atas.map((header) => {
    const data: Record<string, unknown> = {
      ata_id: "93ef9660-8c64-4b51-9bc5-09069ce629c1",
      numero_sequencial_grupo: 1,
      indice_personalizado_grupo: 1,
      grupo_id: groupA,
      data_reuniao: "2026-07-19",
      hora_inicio: "10:00",
      preenchido_por: "Coordenador",
      plataforma: "Zoom",
      tipo_reuniao: "Fechada",
      formato_partilha: true,
      formato_estudo: false,
      formato_tematico: false,
      formato_literatura: false,
      formato_passos: false,
      formato_tradicoes: false,
      total_membros_presentes: 1,
      total_partilhas: 1,
      created_at: "2026-07-19T12:00:00.000Z",
      updated_at: "2026-07-19T12:00:00.000Z",
      ...overrides,
    };
    return data[header] ?? "";
  });
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

  it("planeja criação sem escrever no modo dry run", async () => {
    const names = (Object.keys(SHEET_HEADERS) as SheetName[]).filter(
      (name) => name !== "grupo_servidores_mesa",
    );
    const { client, batchUpdate } = clientWith({ names });

    const result = await reconcileSheetContract(client, "spreadsheet-test", {
      dryRun: true,
    });

    expect(result.createdSheets).toEqual(["grupo_servidores_mesa"]);
    expect(result.requestCount).toBeGreaterThan(0);
    expect(batchUpdate).not.toHaveBeenCalled();
  });

  it("valida identificadores existentes em atas sem mutar quando estão corretos", async () => {
    const { client } = clientWith({
      sheetValues: {
        atas: [
          [...SHEET_HEADERS.atas],
          ataRow(),
          ataRow({
            ata_id: "dbca5f07-744f-4e9f-9169-f7f66d4cbbcc",
            grupo_id: groupB,
          }),
        ],
      },
    });

    await expect(
      reconcileSheetContract(client, "spreadsheet-test"),
    ).resolves.toMatchObject({ validatedSheets: expect.arrayContaining(["atas"]) });
  });

  it("ignora linhas vazias com FALSE herdado ao validar identificadores", async () => {
    const emptyLegacyRow = Array.from(
      { length: SHEET_HEADERS.atas.length },
      (_, index) => index >= SHEET_HEADERS.atas.indexOf("formato_partilha") &&
        index <= SHEET_HEADERS.atas.indexOf("formato_tradicoes")
        ? false
        : "",
    );
    const { client } = clientWith({
      sheetValues: {
        atas: [[...SHEET_HEADERS.atas], ataRow(), emptyLegacyRow],
      },
    });

    await expect(reconcileSheetContract(client, "spreadsheet-test")).resolves.toMatchObject({
      validatedSheets: expect.arrayContaining(["atas"]),
    });
  });

  it.each([
    ["ausente", { numero_sequencial_grupo: "" }, "numero_sequencial_grupo deve ser um inteiro positivo"],
    ["não numérico", { indice_personalizado_grupo: "abc" }, "indice_personalizado_grupo deve ser um inteiro positivo"],
    ["menor que 1", { numero_sequencial_grupo: 0 }, "numero_sequencial_grupo deve ser um inteiro positivo"],
  ])("rejeita identificador %s em atas já migradas", async (_case, overrides, message) => {
    const { client, batchUpdate } = clientWith({
      sheetValues: {
        atas: [[...SHEET_HEADERS.atas], ataRow(overrides)],
      },
    });

    await expect(
      reconcileSheetContract(client, "spreadsheet-test"),
    ).rejects.toThrow(message);
    expect(batchUpdate).not.toHaveBeenCalled();
  });

  it.each([
    ["numero_sequencial_grupo", { numero_sequencial_grupo: 1, indice_personalizado_grupo: 2 }],
    ["indice_personalizado_grupo", { numero_sequencial_grupo: 2, indice_personalizado_grupo: 1 }],
  ])("rejeita duplicidade de %s no mesmo grupo", async (field, overrides) => {
    const { client, batchUpdate } = clientWith({
      sheetValues: {
        atas: [
          [...SHEET_HEADERS.atas],
          ataRow(),
          ataRow({
            ata_id: "dbca5f07-744f-4e9f-9169-f7f66d4cbbcc",
            ...overrides,
          }),
        ],
      },
    });

    await expect(
      reconcileSheetContract(client, "spreadsheet-test"),
    ).rejects.toThrow(`${field} duplicado para o mesmo grupo`);
    expect(batchUpdate).not.toHaveBeenCalled();
  });

  it.each([
    ["nomes antigos", "categoria", "origem_contato"],
    ["cabeçalho atual com interrogação", "descricao", "como_chegou_a_na?"],
  ])("renomeia %s sem duplicar colunas", async (_case, descricao, origem) => {
    const headers: string[] = [...SHEET_HEADERS.visitantes];
    headers[SHEET_HEADERS.visitantes.indexOf("descricao")] = descricao;
    headers[SHEET_HEADERS.visitantes.indexOf("como_chegou_a_na")] = origem;
    const { client, batchUpdate } = clientWith({
      afterMigration: true,
      invalidHeader: { visitantes: headers },
    });

    await reconcileSheetContract(client, "spreadsheet-test");

    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    expect(requests).toContainEqual(
      expect.objectContaining({
        updateCells: expect.objectContaining({
          range: expect.objectContaining({
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: SHEET_HEADERS.visitantes.indexOf("descricao"),
          }),
          rows: [{
            values: ["descricao", "como_chegou_a_na"].map((header) => ({
              userEnteredValue: { stringValue: header },
            })),
          }],
        }),
      }),
    );
    expect(
      requests.some((request: object) => "insertDimension" in request),
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

  it("migra identificadores de atas existentes numerando por grupo", async () => {
    const identifierColumns = [
      "numero_sequencial_grupo",
      "indice_personalizado_grupo",
    ];
    const oldHeaders = SHEET_HEADERS.atas.filter(
      (header) => !identifierColumns.includes(header),
    );
    const groupA = "fccced1d-92a5-4d24-b5af-da65cbbe467f";
    const groupB = "2bed9d1b-7fea-4cf4-9497-f0ccbcead41c";
    const row = (
      ataId: string,
      grupoId: string,
      createdAt: string,
      data: string,
      hora: string,
    ) =>
      oldHeaders.map((header) => {
        if (header === "ata_id") return ataId;
        if (header === "grupo_id") return grupoId;
        if (header === "created_at") return createdAt;
        if (header === "updated_at") return createdAt;
        if (header === "data_reuniao") return data;
        if (header === "hora_inicio") return hora;
        return "";
      });
    const { client, batchUpdate } = clientWith({
      afterMigration: true,
      invalidHeader: { atas: oldHeaders },
      sheetValues: {
        atas: [
          oldHeaders,
          row("93ef9660-8c64-4b51-9bc5-09069ce629c1", groupA, "2026-06-02T12:00:00.000Z", "2026-06-02", "10:00"),
          row("dbca5f07-744f-4e9f-9169-f7f66d4cbbcc", groupB, "2026-06-01T12:00:00.000Z", "2026-06-01", "10:00"),
          row("a4e54dd9-8e3f-4d56-a932-00ea5c13fc88", groupA, "2026-06-01T12:00:00.000Z", "2026-06-01", "10:00"),
        ],
      },
    });

    const result = await reconcileSheetContract(client, "spreadsheet-test");

    for (const column of identifierColumns) {
      expect(result.addedColumns).toContainEqual({ sheet: "atas", column });
    }
    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    expect(requests).toContainEqual(
      expect.objectContaining({
        insertDimension: expect.objectContaining({
          range: expect.objectContaining({
            dimension: "COLUMNS",
            startIndex: SHEET_HEADERS.atas.indexOf(identifierColumns[0]),
            endIndex:
              SHEET_HEADERS.atas.indexOf(identifierColumns[0]) +
              identifierColumns.length,
          }),
        }),
      }),
    );
    expect(requests).toContainEqual(
      expect.objectContaining({
        updateCells: expect.objectContaining({
          range: expect.objectContaining({
            startRowIndex: 1,
            startColumnIndex: SHEET_HEADERS.atas.indexOf(identifierColumns[0]),
          }),
          rows: [
            { values: [{ userEnteredValue: { numberValue: 2 } }, { userEnteredValue: { numberValue: 2 } }] },
            { values: [{ userEnteredValue: { numberValue: 1 } }, { userEnteredValue: { numberValue: 1 } }] },
            { values: [{ userEnteredValue: { numberValue: 1 } }, { userEnteredValue: { numberValue: 1 } }] },
          ],
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

  it("adiciona campos novos da Fase 3 em atas quando estão ausentes", async () => {
    const newAtaColumns = ["duracao", "formato_outros"];
    const { client, batchUpdate } = clientWith({
      afterMigration: true,
      invalidHeader: {
        atas: SHEET_HEADERS.atas.filter(
          (header) => !newAtaColumns.includes(header),
        ),
      },
    });

    const result = await reconcileSheetContract(client, "spreadsheet-test");

    for (const column of newAtaColumns) {
      expect(result.addedColumns).toContainEqual({ sheet: "atas", column });
    }
    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    expect(requests).toContainEqual(
      expect.objectContaining({
        insertDimension: expect.objectContaining({
          range: expect.objectContaining({
            dimension: "COLUMNS",
            startIndex: SHEET_HEADERS.atas.indexOf(newAtaColumns[0]),
            endIndex:
              SHEET_HEADERS.atas.indexOf(newAtaColumns[0]) +
              newAtaColumns.length,
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
      "ultima_reuniao_anterior",
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

  it("adiciona ultima_reuniao_anterior em grupos quando só essa coluna está ausente", async () => {
    const { client } = clientWith({
      afterMigration: true,
      invalidHeader: {
        grupos: SHEET_HEADERS.grupos.filter(
          (header) => header !== "ultima_reuniao_anterior",
        ),
      },
    });

    const result = await reconcileSheetContract(client, "spreadsheet-test");

    expect(result.addedColumns).toContainEqual({
      sheet: "grupos",
      column: "ultima_reuniao_anterior",
    });
  });

  it("adiciona fuso, plataforma e acesso ao final de grupos legados", async () => {
    const newColumns = ["fuso_horario", "plataforma", "acesso_plataforma"];
    const legacyHeaders = SHEET_HEADERS.grupos.filter(
      (header) => !newColumns.includes(header),
    );
    const { client, batchUpdate } = clientWith({
      afterMigration: true,
      invalidHeader: { grupos: legacyHeaders },
    });

    const result = await reconcileSheetContract(client, "spreadsheet-test");

    expect(result.addedColumns).toEqual(
      expect.arrayContaining(newColumns.map((column) => ({ sheet: "grupos", column }))),
    );
    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    expect(requests).toContainEqual(
      expect.objectContaining({
        insertDimension: expect.objectContaining({
          range: expect.objectContaining({
            startIndex: legacyHeaders.length,
            endIndex: legacyHeaders.length + newColumns.length,
          }),
        }),
      }),
    );
  });

  it("adiciona funcao em servidores quando a coluna está ausente", async () => {
    const { client } = clientWith({
      afterMigration: true,
      invalidHeader: {
        servidores: SHEET_HEADERS.servidores.filter(
          (header) => header !== "funcao",
        ),
      },
    });

    const result = await reconcileSheetContract(client, "spreadsheet-test");

    expect(result.addedColumns).toContainEqual({
      sheet: "servidores",
      column: "funcao",
    });
  });

  it("reconcilia validações controladas de visitantes", async () => {
    const { client, batchUpdate } = clientWith();

    await reconcileSheetContract(client, "spreadsheet-test");

    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    for (const column of ["descricao", "como_chegou_a_na"] as const) {
      expect(requests).toContainEqual(
        expect.objectContaining({
          repeatCell: expect.objectContaining({
            range: expect.objectContaining({
              startColumnIndex: SHEET_HEADERS.visitantes.indexOf(column),
              endColumnIndex: SHEET_HEADERS.visitantes.indexOf(column) + 1,
            }),
            fields: "dataValidation",
          }),
        }),
      );
    }
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
                values: tempoLimpoMapping.labels.map((userEnteredValue) => ({
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

  it("remove dropdowns herdados das colunas textuais de atas", async () => {
    const { client, batchUpdate } = clientWith();

    await reconcileSheetContract(client, "spreadsheet-test");

    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    expect(requests).toContainEqual(
      expect.objectContaining({
        repeatCell: expect.objectContaining({
          range: expect.objectContaining({
            sheetId:
              (Object.keys(SHEET_HEADERS) as SheetName[]).indexOf("atas") + 1,
            startColumnIndex: SHEET_HEADERS.atas.indexOf("duracao"),
            endColumnIndex:
              SHEET_HEADERS.atas.indexOf("preenchido_por") + 1,
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
      tempoLimpoMapping.labels.map((userEnteredValue) => ({
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
