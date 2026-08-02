import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AtaPdfActions } from "./ata-pdf-actions";

describe("ações do PDF da ata", () => {
  it("oferece pré-visualização em nova aba e envio por e-mail", () => {
    const html = renderToStaticMarkup(
      <AtaPdfActions
        ataId="024d893a-98cc-4df6-82b1-0cd09fd1d90c"
        title="Ata 1 - USL"
        filename="ata-usl.pdf"
        defaultRecipient="usl@example.com"
      />,
    );
    expect(html).toContain("Visualizar PDF");
    expect(html).toContain("Enviar por e-mail");
    expect(html).toContain('target="_blank"');
    expect(html).toContain("/atas/024d893a-98cc-4df6-82b1-0cd09fd1d90c/pdf");
  });

  it("permite usar apenas a ação de e-mail dentro da pré-visualização", () => {
    const html = renderToStaticMarkup(
      <AtaPdfActions
        ataId="024d893a-98cc-4df6-82b1-0cd09fd1d90c"
        title="Ata 1 - USL"
        filename="ata-usl.pdf"
        defaultRecipient="usl@example.com"
        showPreview={false}
        iconOnly
      />,
    );
    expect(html).not.toContain("Visualizar PDF");
    expect(html).toContain('aria-label="Enviar por e-mail"');
    expect(html).toContain('title="Enviar por e-mail"');
  });
});
