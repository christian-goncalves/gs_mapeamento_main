import { describe, expect, it } from "vitest";
import {
  normalizeServerFunctionName,
  serverFunctionComparisonKey,
} from "./server-functions";

describe("server functions", () => {
  it("normalizes spaces and capitalizes only the first letter", () => {
    expect(normalizeServerFunctionName("  apoio   técnico ")).toBe("Apoio técnico");
  });

  it("generates a case-insensitive comparison key", () => {
    expect(serverFunctionComparisonKey("  Apoio   Técnico ")).toBe("apoio técnico");
    expect(serverFunctionComparisonKey("apoio técnico")).toBe(
      serverFunctionComparisonKey("APOIO TÉCNICO"),
    );
  });
});
