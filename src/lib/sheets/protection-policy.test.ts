import { describe, expect, it, vi } from "vitest";

import { SHEET_HEADERS, type SheetName } from "./contract";
import {
  MANAGED_PROTECTION_PREFIX,
  parseManualSheetsEditEnabled,
  reconcileSheetProtections,
  type ProtectionClient,
} from "./protection-policy";

const names = Object.keys(SHEET_HEADERS) as SheetName[];
const serviceAccountEmail = "service@example.iam.gserviceaccount.com";

type Protection = {
  protectedRangeId: number;
  description: string;
  range: { sheetId: number; startRowIndex?: number };
  warningOnly?: boolean;
  editors?: {
    users?: string[];
    groups?: string[];
    domainUsersCanEdit?: boolean;
  };
};

function managed(sheet: SheetName, id: number): Protection {
  const sheetId = names.indexOf(sheet);
  return {
    protectedRangeId: id,
    description: `${MANAGED_PROTECTION_PREFIX}${sheet}`,
    range: { sheetId },
    warningOnly: false,
    editors: { users: [serviceAccountEmail] },
  };
}

function clientWith(
  protections: Partial<Record<SheetName, Protection[]>> = {},
  options: { invalidHeader?: boolean; batchFailure?: Error } = {},
) {
  const batchUpdate = options.batchFailure
    ? vi.fn().mockRejectedValue(options.batchFailure)
    : vi.fn().mockResolvedValue({});
  const client = {
    spreadsheets: {
      get: vi.fn().mockResolvedValue({
        data: {
          sheets: names.map((name, sheetId) => ({
            properties: { title: name, sheetId },
            protectedRanges: protections[name] ?? [],
          })),
        },
      }),
      values: {
        batchGet: vi.fn().mockResolvedValue({
          data: {
            valueRanges: names.map((name, index) => ({
              values: [
                options.invalidHeader && index === 0
                  ? ["invalido"]
                  : [...SHEET_HEADERS[name]],
              ],
            })),
          },
        }),
      },
      batchUpdate,
    },
  } as unknown as ProtectionClient;
  return { client, batchUpdate };
}

function reconcile(
  client: ProtectionClient,
  manualEditEnabled: boolean,
) {
  return reconcileSheetProtections(client, {
    spreadsheetId: "spreadsheet-test",
    serviceAccountEmail,
    manualEditEnabled,
  });
}

describe("política de proteções do Sheets", () => {
  it("com true remove somente proteções gerenciadas", async () => {
    const manual: Protection = {
      protectedRangeId: 91,
      description: "Proteção criada manualmente",
      range: { sheetId: 0 },
    };
    const { client, batchUpdate } = clientWith({
      grupos: [manual, managed("grupos", 92)],
    });

    await reconcile(client, true);

    expect(batchUpdate).toHaveBeenCalledOnce();
    expect(batchUpdate.mock.calls[0][0].requestBody.requests).toEqual([
      { deleteProtectedRange: { protectedRangeId: 92 } },
    ]);
  });

  it("com false cria uma proteção para cada aba do contrato", async () => {
    const { client, batchUpdate } = clientWith();
    await reconcile(client, false);

    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    expect(requests).toHaveLength(names.length);
    expect(requests.every((request: object) => "addProtectedRange" in request))
      .toBe(true);
  });

  it("mantém a conta de serviço como editora permitida", async () => {
    const { client, batchUpdate } = clientWith();
    await reconcile(client, false);

    for (const request of batchUpdate.mock.calls[0][0].requestBody.requests) {
      expect(request.addProtectedRange.protectedRange.editors.users).toEqual([
        serviceAccountEmail,
      ]);
    }
  });

  it("não duplica proteções em uma execução repetida", async () => {
    const existing = Object.fromEntries(
      names.map((name, index) => [name, [managed(name, 100 + index)]]),
    );
    const { client, batchUpdate } = clientWith(existing);

    const result = await reconcile(client, false);

    expect(result.requestCount).toBe(0);
    expect(batchUpdate).not.toHaveBeenCalled();
  });

  it("corrige uma proteção gerenciada divergente", async () => {
    const divergent = managed("atas", 101);
    divergent.warningOnly = true;
    divergent.range.startRowIndex = 1;
    divergent.editors = { users: ["outro@example.com"] };
    const existing = Object.fromEntries(
      names.map((name, index) => [name, [managed(name, 100 + index)]]),
    );
    existing.atas = [divergent];
    const { client, batchUpdate } = clientWith(existing);

    await reconcile(client, false);

    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    expect(requests).toHaveLength(1);
    expect(requests[0].updateProtectedRange.protectedRange).toMatchObject({
      protectedRangeId: 101,
      warningOnly: false,
      range: { sheetId: names.indexOf("atas") },
      editors: { users: [serviceAccountEmail] },
    });
  });

  it("preserva proteção manual quando protege as abas", async () => {
    const { client, batchUpdate } = clientWith({
      grupos: [
        {
          protectedRangeId: 91,
          description: "Proteção criada manualmente",
          range: { sheetId: 0 },
        },
      ],
    });
    await reconcile(client, false);

    const requests = batchUpdate.mock.calls[0][0].requestBody.requests;
    expect(requests).toHaveLength(names.length);
    expect(JSON.stringify(requests)).not.toContain("91");
  });

  it("propaga falha do único lote sem retornar sucesso", async () => {
    const { client, batchUpdate } = clientWith({}, {
      batchFailure: new Error("Falha no lote"),
    });

    await expect(reconcile(client, false)).rejects.toThrow("Falha no lote");
    expect(batchUpdate).toHaveBeenCalledOnce();
  });

  it("rejeita configuração e cabeçalho inválidos antes de mutar", async () => {
    expect(() => parseManualSheetsEditEnabled(undefined)).toThrow(
      "exatamente true ou false",
    );
    expect(() => parseManualSheetsEditEnabled("TRUE")).toThrow(
      "exatamente true ou false",
    );
    const { client, batchUpdate } = clientWith({}, { invalidHeader: true });
    await expect(reconcile(client, false)).rejects.toThrow(
      "Cabeçalho inválido",
    );
    expect(batchUpdate).not.toHaveBeenCalled();
  });
});
