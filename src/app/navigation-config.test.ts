import { describe, expect, it } from "vitest";
import {
  adminNavigationItems,
  responsavelNavigationItems,
} from "./navigation-config";

describe("navigation config", () => {
  it("preserva a ordem e os destinos administrativos", () => {
    expect(adminNavigationItems).toEqual([
      { section: "grupos", label: "Grupos", href: "/admin/grupos" },
      { section: "atas", label: "Atas", href: "/admin/atas" },
      { section: "usuarios", label: "Usuários", href: "/admin/usuarios" },
      {
        section: "relatorios",
        label: "Relatórios",
        href: "/admin/relatorios",
      },
      {
        section: "configuracoes",
        label: "Configurações",
        href: "/admin/configuracoes",
      },
    ]);
  });

  it("preserva as rotas do responsável e o destino dinâmico de configurações", () => {
    expect(responsavelNavigationItems("/grupos/grupo-1")).toEqual([
      {
        section: "responsavel",
        label: "Responsável",
        href: "/responsavel/atas",
      },
      {
        section: "atas",
        label: "Atas",
        href: "/responsavel/atas/nova",
      },
      {
        section: "relatorios",
        label: "Relatórios",
        href: "/responsavel/relatorios",
      },
      {
        section: "configuracoes",
        label: "Configurações",
        href: "/grupos/grupo-1",
      },
    ]);
  });
});
