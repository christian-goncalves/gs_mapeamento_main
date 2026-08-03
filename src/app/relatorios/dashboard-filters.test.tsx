import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DashboardFilters, submitDashboardFilters } from "./dashboard-filters";

describe("filtros do dashboard mensal", () => {
  it("envia o formulário automaticamente quando um filtro muda", () => {
    const requestSubmit = vi.fn();

    submitDashboardFilters({
      currentTarget: { form: { requestSubmit } },
    } as never);

    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });

  it("renderiza mês, ano e PDF sem botão Filtrar", () => {
    const html = renderToStaticMarkup(
      <DashboardFilters
        action="/responsavel/relatorios"
        groups={[]}
        years={[2026]}
        selectedGroupId="grupo-1"
        selectedMonth="8"
        selectedYear="2026"
        showGroupFilter={false}
      />,
    );

    expect(html).toContain('name="mes"');
    expect(html).toContain('name="ano"');
    expect(html).toContain("PDF");
    expect(html).not.toContain("Filtrar");
  });
});
