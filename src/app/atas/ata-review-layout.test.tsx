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
    cities: 1,
    states: 1,
    otherCountries: 1,
  },
};

describe("layout compartilhado da ata", () => {
  it("renderiza o mesmo núcleo visual com indicadores complementares", () => {
    const html = renderToStaticMarkup(
      <AtaReviewLayout
        title="Ata de reunião nº 19 - USL"
        description="Visualização da ata."
        titleId="ata-title"
        headingLevel="h1"
        data={data}
      />,
    );

    expect(html).toContain("Ata de reunião nº 19 - USL");
    expect(html).toContain("31/07/2026");
    expect(html).toContain("Membros internacionais");
    expect(html).toContain("Outros países");
    expect(html).toContain("Coordenador");
  });
});
