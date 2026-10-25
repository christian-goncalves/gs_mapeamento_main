import type { ReactNode } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartSimple,
  faClockRotateLeft,
  faGear,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { signOut } from "@/auth";
import { AppShell } from "@/app/app-shell";
import {
  responsavelNavigationItems,
  type ResponsavelSection,
} from "@/app/navigation-config";

const responsavelIcons: Record<
  ResponsavelSection,
  Parameters<typeof FontAwesomeIcon>[0]["icon"]
> = {
  responsavel: faClockRotateLeft,
  relatorios: faChartSimple,
  configuracoes: faGear,
};

export function ResponsavelShell({
  children,
  activeSection,
  settingsHref,
}: {
  children: ReactNode;
  activeSection: ResponsavelSection;
  settingsHref: string;
}) {
  return (
    <AppShell
      variant="responsavel"
      homeHref="/responsavel/atas"
      homeLabel="Página inicial do responsável"
      navigationLabel="Navegação do responsável"
      navigation={
        <>
          {responsavelNavigationItems(settingsHref).map((item) => (
            <Link
              key={item.section}
              className={
                activeSection === item.section
                  ? "app-nav-item app-nav-item-active"
                  : "app-nav-item"
              }
              href={item.href}
              aria-current={activeSection === item.section ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <FontAwesomeIcon icon={responsavelIcons[item.section]} />
              <span>{item.label}</span>
            </Link>
          ))}

          <form
            className="app-signout-form"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="app-nav-item app-signout-button"
              aria-label="Sair"
              title="Sair"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span>Sair</span>
            </button>
          </form>
        </>
      }
    >
      {children}
    </AppShell>
  );
}
