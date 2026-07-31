import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AtaReviewLayout, type AtaReviewLayoutData } from "./ata-review-layout";

const data: AtaReviewLayoutData = {
  group: "USL",
  date: "2026-07-31",
  time: "21:30",
  filledBy: "CHRISTIAN",
  platform: "Zoom",
  meetingType: "Fechada",
  formats: "Partilha",
  membersPresent: 50,
  shares: 15,
  servers: [{ id: "server-1", name: "CHRISTIAN", role: "Coordenador" }],
  locations: [{ id: "location-1", name: "Itajaí - SC", count: 2 }],
  internationalMembers: [{ id: "country-1", country: "Marrocos", count: 1 }],
  visitors: [],
  admissions: [],
  achievements: [],
  supplementalMetrics: {
    states: 1,
    countries: 2,
    membersWithoutLocation: 47,
  },
};

describe("layout compartilhado da ata", () => {
  it("renderiza o mesmo núcleo visual com indicadores complementares", () => {
    const html = renderToStaticMarkup(
      <AtaReviewLayout
        title="Ata #19 — USL"
        description="Visualização da ata."
        titleId="ata-title"
        headingLevel="h1"
        data={data}
      />,
    );

    expect(html).toContain("Ata #19 — USL");
    expect(html).toContain("31/07/2026");
    expect(html).toContain("Membros internacionais");
    expect(html).toContain("Dados complementares da ata");
    expect(html).toContain("Membros sem localidade");
    expect(html).toContain("Coordenador");
  });
});
