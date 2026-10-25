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
    expect(html).toContain("<dt>Data</dt><dd>31/07/2026</dd>");
    expect(html).toContain("<dt>Horário</dt><dd>21:30</dd>");
    expect(html).not.toContain("Data e hora");
    expect(html).toContain("31/07/2026");
    expect(html).toContain("Localidades internacionais");
    expect(html).toContain("Outros países");
    expect(html).toContain("Coordenador");
  });

  it("mantém Preenchido por no layout com fallback e permite ocultá-lo na prévia", () => {
    const missingFilledBy = { ...data, filledBy: "" };
    const detailHtml = renderToStaticMarkup(
      <AtaReviewLayout
        title="Ata de reunião nº 19 - USL"
        titleId="ata-title"
        headingLevel="h1"
        data={missingFilledBy}
      />,
    );
    const previewHtml = renderToStaticMarkup(
      <AtaReviewLayout
        title="Ata de reunião nº 19 - USL"
        titleId="ata-title"
        headingLevel="h1"
        data={missingFilledBy}
        showFilledBy={false}
      />,
    );

    expect(detailHtml).toContain("<dt>Preenchido por</dt><dd>Não informado</dd>");
    expect(previewHtml).not.toContain("<dt>Preenchido por</dt>");
  });

  it("oculta Formato outros sem remover as demais informações adicionais", () => {
    const html = renderToStaticMarkup(
      <AtaReviewLayout
        title="Ata de reunião nº 19 - USL"
        titleId="ata-title"
        data={{
          ...data,
          additionalInformation: [
            { label: "Formato outros", value: "Outro formato" },
            { label: "Duração", value: "1:30" },
          ],
        }}
      />,
    );

    expect(html).not.toContain("Formato outros");
    expect(html).toContain("<dt>Duração</dt><dd>1:30</dd>");
  });

  it("remove Membros presentes e Partilhas dos cards superiores e mantém os totais", () => {
    const html = renderToStaticMarkup(
      <AtaReviewLayout
        title="Ata de reunião nº 19 - USL"
        titleId="ata-title"
        data={data}
      />,
    );
    const primaryDetails = html.split('<dl class="review-metrics"')[0];

    expect(primaryDetails).not.toContain("Membros presentes");
    expect(primaryDetails).not.toContain("<dt>Partilhas</dt>");
    expect(primaryDetails.indexOf("<dt>Data</dt>")).toBeLessThan(primaryDetails.indexOf("<dt>Horário</dt>"));
    expect(primaryDetails.indexOf("<dt>Horário</dt>")).toBeLessThan(primaryDetails.indexOf("<dt>Preenchido por</dt>"));
    expect(html).toContain("<dt>Membros</dt><dd>50</dd>");
    expect(html).toContain("<dt>Partilhas</dt><dd>15</dd>");
  });
});
