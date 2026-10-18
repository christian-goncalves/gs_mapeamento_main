export type AdminSection =
  | "grupos"
  | "atas"
  | "usuarios"
  | "relatorios"
  | "configuracoes";

export type ResponsavelSection =
  | "responsavel"
  | "relatorios"
  | "configuracoes";

export type NavigationItem<Section extends string> = {
  section: Section;
  label: string;
  href: string;
};

export const adminNavigationItems: readonly NavigationItem<AdminSection>[] = [
  { section: "grupos", label: "Grupos", href: "/admin/grupos" },
  { section: "atas", label: "Atas", href: "/admin/atas" },
  { section: "usuarios", label: "Usuários", href: "/admin/usuarios" },
  { section: "relatorios", label: "Relatórios", href: "/admin/relatorios" },
  {
    section: "configuracoes",
    label: "Configurações",
    href: "/admin/configuracoes",
  },
];

export function responsavelNavigationItems(
  settingsHref: string,
): readonly NavigationItem<ResponsavelSection>[] {
  return [
    {
      section: "configuracoes",
      label: "Dados cadastrais",
      href: settingsHref,
    },
    {
      section: "responsavel",
      label: "Histórico de atas",
      href: "/responsavel/atas",
    },
    {
      section: "relatorios",
      label: "Relatórios",
      href: "/responsavel/relatorios",
    },
  ];
}
