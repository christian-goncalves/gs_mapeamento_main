import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminSessionWithAggregatedAtas: vi.fn(),
}));

vi.mock("@/lib/auth/require-session", () => ({
  requireAdminSessionWithAggregatedAtas:
    mocks.requireAdminSessionWithAggregatedAtas,
}));
vi.mock("@/app/grupos/admin-groups-panel", () => ({
  AdminGroupsPanel: () => null,
}));
vi.mock("@/app/grupos/admin-shell", () => ({
  AdminShell: ({ children }: { children: unknown }) => children,
}));

import AdminGruposPage from "./page";

describe("página administrativa de grupos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminSessionWithAggregatedAtas.mockResolvedValue({
      result: {
        grupos: [],
        grupo_horarios: [],
      },
    });
  });

  it("reutiliza a única leitura agregada feita pela autorização", async () => {
    await AdminGruposPage({ searchParams: Promise.resolve({}) });

    expect(
      mocks.requireAdminSessionWithAggregatedAtas,
    ).toHaveBeenCalledTimes(1);
  });
});
