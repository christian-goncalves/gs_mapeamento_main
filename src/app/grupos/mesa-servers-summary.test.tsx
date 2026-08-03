import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  deactivateGrupoServidorMesaAction: vi.fn(),
  saveGrupoServidorMesaAction: vi.fn(),
}));

import { MesaServersSummary } from "./mesa-servers-summary";

describe("resumo dos servidores da mesa", () => {
  it("exibe encargo, servidor e ações sem o editor coletivo", () => {
    const html = renderToStaticMarkup(
      <MesaServersSummary
        grupoId="11111111-1111-4111-8111-111111111111"
        servidores={[
          {
            grupo_servidor_mesa_id: "22222222-2222-4222-8222-222222222222",
            grupo_id: "11111111-1111-4111-8111-111111111111",
            encargo: "RSG",
            nome: "Carlos",
            data_inicio: "2026-08-03",
            ativo: true,
            ordem: 1,
            created_at: "2026-08-03T12:00:00.000Z",
            updated_at: "2026-08-03T12:00:00.000Z",
          },
        ]}
      />,
    );

    expect(html).toContain("Encargo");
    expect(html).toContain("Servidor");
    expect(html).toContain("Ações");
    expect(html).toContain("Carlos");
    expect(html).not.toContain("Data de início</th>");
    expect(html).not.toContain("Editar servidores da mesa");
    expect(html).not.toContain("Informe os encargos atuais do grupo");
  });
});
