import { PDFDocument } from "pdf-lib";
import { describe, expect, it, vi } from "vitest";
import type { AtaPresentation } from "@/app/atas/ata-presentation";

vi.mock("server-only", () => ({}));

import { renderAtaPdf } from "./ata-pdf-document";

function presentation(locationCount = 2): AtaPresentation {
  return {
    ataId: "024d893a-98cc-4df6-82b1-0cd09fd1d90c",
    title: "Ata 1 - USL",
    filename: "ata-usl-2026-07-01-1.pdf",
    groupEmail: "usl@example.com",
    groupActive: true,
    groupReference: "1",
    sequential: 1,
    reviewData: {
      group: "USL", date: "2026-07-01", time: "07:00", filledBy: "Bruno",
      platform: "Zoom", meetingType: "Fechada", formats: "Partilha",
      membersPresent: 46, shares: 14,
      servers: [{ id: "s1", name: "Gustavo", role: "Secretário" }],
      locations: Array.from({ length: locationCount }, (_, index) => ({ id: `l${index}`, name: `Localidade ${index} - SC`, count: 2 })),
      internationalMembers: [], visitors: [], admissions: [], achievements: [],
      supplementalMetrics: { states: 1, countries: 1, membersWithoutLocation: 2 },
    },
  };
}

describe("PDF visual da ata", () => {
  it("gera um PDF A4 válido", async () => {
    const bytes = await renderAtaPdf(presentation(), new Date("2026-08-02T12:00:00Z"));
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
    const document = await PDFDocument.load(bytes);
    const size = document.getPage(0).getSize();
    expect(size.width).toBeCloseTo(595.28, 1);
    expect(size.height).toBeCloseTo(841.89, 1);
  });

  it("pagina listas extensas sem criar página de altura variável", async () => {
    const bytes = await renderAtaPdf(presentation(120));
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBeGreaterThan(1);
    for (const page of document.getPages()) {
      expect(page.getSize().height).toBeCloseTo(841.89, 1);
    }
  });
});
