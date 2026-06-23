import type { sheets_v4 } from "googleapis";

import { SHEET_HEADERS, type SheetName } from "./contract";

export const MANAGED_PROTECTION_PREFIX =
  "gs-mapeamento:managed-sheet-protection:v1:";

type ProtectedRange = {
  protectedRangeId?: number | null;
  description?: string | null;
  range?: sheets_v4.Schema$GridRange | null;
  warningOnly?: boolean | null;
  editors?: sheets_v4.Schema$Editors | null;
};

type SheetSnapshot = {
  properties?: {
    sheetId?: number | null;
    title?: string | null;
  } | null;
  protectedRanges?: ProtectedRange[] | null;
};

export type ProtectionClient = {
  spreadsheets: {
    get: (request: {
      spreadsheetId: string;
      fields: string;
    }) => Promise<{ data: { sheets?: SheetSnapshot[] | null } }>;
    values: {
      batchGet: (request: {
        spreadsheetId: string;
        ranges: string[];
      }) => Promise<{
        data: {
          valueRanges?: Array<{ values?: unknown[][] | null }> | null;
        };
      }>;
    };
    batchUpdate: (request: {
      spreadsheetId: string;
      requestBody: { requests: sheets_v4.Schema$Request[] };
    }) => Promise<unknown>;
  };
};

export type ReconciliationResult = {
  manualEditEnabled: boolean;
  requestCount: number;
  managedProtectionCount: number;
};

const sheetNames = Object.keys(SHEET_HEADERS) as SheetName[];

export function parseManualSheetsEditEnabled(value: string | undefined) {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(
    "MANUAL_SHEETS_EDIT_ENABLED deve ser exatamente true ou false.",
  );
}

function managedDescription(sheet: SheetName) {
  return `${MANAGED_PROTECTION_PREFIX}${sheet}`;
}

function isManaged(protection: ProtectedRange) {
  return protection.description?.startsWith(MANAGED_PROTECTION_PREFIX) ?? false;
}

function sameEditors(
  editors: sheets_v4.Schema$Editors | null | undefined,
  serviceAccountEmail: string,
) {
  return (
    editors?.domainUsersCanEdit !== true &&
    (editors?.groups?.length ?? 0) === 0 &&
    editors?.users?.length === 1 &&
    editors.users[0] === serviceAccountEmail
  );
}

function isExpectedProtection(
  protection: ProtectedRange,
  sheet: SheetName,
  sheetId: number,
  serviceAccountEmail: string,
) {
  const range = protection.range;
  return (
    protection.description === managedDescription(sheet) &&
    protection.warningOnly !== true &&
    range?.sheetId === sheetId &&
    range.startRowIndex == null &&
    range.endRowIndex == null &&
    range.startColumnIndex == null &&
    range.endColumnIndex == null &&
    sameEditors(protection.editors, serviceAccountEmail)
  );
}

function desiredProtection(
  sheet: SheetName,
  sheetId: number,
  serviceAccountEmail: string,
): sheets_v4.Schema$ProtectedRange {
  return {
    description: managedDescription(sheet),
    range: { sheetId },
    warningOnly: false,
    editors: { users: [serviceAccountEmail] },
  };
}

function validateSnapshot(
  sheets: SheetSnapshot[],
  valueRanges: Array<{ values?: unknown[][] | null }>,
) {
  const byName = new Map<string, SheetSnapshot>();
  const ids = new Set<number>();

  for (const sheet of sheets) {
    const title = sheet.properties?.title;
    if (title) byName.set(title, sheet);
  }

  return Object.fromEntries(
    sheetNames.map((name, index) => {
      const sheet = byName.get(name);
      const sheetId = sheet?.properties?.sheetId;
      if (!Number.isInteger(sheetId) || sheetId == null) {
        throw new Error(`ID da aba ${name} não encontrado ou inválido.`);
      }
      if (ids.has(sheetId)) throw new Error(`ID de aba duplicado: ${sheetId}.`);
      ids.add(sheetId);

      const actual = valueRanges[index]?.values?.[0] ?? [];
      const expected = [...SHEET_HEADERS[name]];
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Cabeçalho inválido na aba ${name}.`);
      }

      return [name, { sheetId, protectedRanges: sheet?.protectedRanges ?? [] }];
    }),
  ) as Record<
    SheetName,
    { sheetId: number; protectedRanges: ProtectedRange[] }
  >;
}

export function buildProtectionRequests(
  snapshot: ReturnType<typeof validateSnapshot>,
  manualEditEnabled: boolean,
  serviceAccountEmail: string,
) {
  if (!serviceAccountEmail.trim()) {
    throw new Error("E-mail da conta de serviço ausente.");
  }

  const requests: sheets_v4.Schema$Request[] = [];
  for (const name of sheetNames) {
    const { sheetId, protectedRanges } = snapshot[name];
    const managed = protectedRanges.filter(isManaged);

    if (manualEditEnabled) {
      for (const protection of managed) {
        if (!Number.isInteger(protection.protectedRangeId)) {
          throw new Error(`Proteção gerenciada sem ID na aba ${name}.`);
        }
        requests.push({
          deleteProtectedRange: {
            protectedRangeId: protection.protectedRangeId,
          },
        });
      }
      continue;
    }

    const [primary, ...duplicates] = managed;
    if (!primary) {
      requests.push({
        addProtectedRange: {
          protectedRange: desiredProtection(
            name,
            sheetId,
            serviceAccountEmail,
          ),
        },
      });
    } else {
      if (!Number.isInteger(primary.protectedRangeId)) {
        throw new Error(`Proteção gerenciada sem ID na aba ${name}.`);
      }
      if (!isExpectedProtection(primary, name, sheetId, serviceAccountEmail)) {
        requests.push({
          updateProtectedRange: {
            protectedRange: {
              protectedRangeId: primary.protectedRangeId,
              ...desiredProtection(name, sheetId, serviceAccountEmail),
            },
            fields: "description,range,warningOnly,editors",
          },
        });
      }
    }

    for (const duplicate of duplicates) {
      if (!Number.isInteger(duplicate.protectedRangeId)) {
        throw new Error(`Proteção gerenciada sem ID na aba ${name}.`);
      }
      requests.push({
        deleteProtectedRange: {
          protectedRangeId: duplicate.protectedRangeId,
        },
      });
    }
  }
  return requests;
}

export async function reconcileSheetProtections(
  client: ProtectionClient,
  configuration: {
    spreadsheetId: string;
    serviceAccountEmail: string;
    manualEditEnabled: boolean;
  },
): Promise<ReconciliationResult> {
  const [metadataResponse, valuesResponse] = await Promise.all([
    client.spreadsheets.get({
      spreadsheetId: configuration.spreadsheetId,
      fields:
        "sheets(properties(sheetId,title),protectedRanges(protectedRangeId,description,range,warningOnly,editors(users,groups,domainUsersCanEdit)))",
    }),
    client.spreadsheets.values.batchGet({
      spreadsheetId: configuration.spreadsheetId,
      ranges: sheetNames.map((name) => `${name}!1:1`),
    }),
  ]);
  const snapshot = validateSnapshot(
    metadataResponse.data.sheets ?? [],
    valuesResponse.data.valueRanges ?? [],
  );
  const requests = buildProtectionRequests(
    snapshot,
    configuration.manualEditEnabled,
    configuration.serviceAccountEmail,
  );

  if (requests.length > 0) {
    await client.spreadsheets.batchUpdate({
      spreadsheetId: configuration.spreadsheetId,
      requestBody: { requests },
    });
  }

  return {
    manualEditEnabled: configuration.manualEditEnabled,
    requestCount: requests.length,
    managedProtectionCount: configuration.manualEditEnabled ? 0 : sheetNames.length,
  };
}
