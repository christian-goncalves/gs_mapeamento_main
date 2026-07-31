import type { ReactNode } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartSimple,
  faFileLines,
  faGear,
  faRightFromBracket,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { signOut } from "@/auth";
import { AppShell } from "@/app/app-shell";
import {
  adminNavigationItems,
  type AdminSection,
} from "@/app/navigation-config";

const adminIcons: Record<
  AdminSection,
  Parameters<typeof FontAwesomeIcon>[0]["icon"]
> = {
  grupos: faUsers,
  atas: faFileLines,
  usuarios: faUser,
  relatorios: faChartSimple,
  configuracoes: faGear,
};

export function AdminShell({
  children,
  activeSection = "grupos",
}: {
  children: ReactNode;
  activeSection?: AdminSection;
}) {
  return (
    <AppShell
      variant="admin"
      homeHref="/admin/grupos"
      homeLabel="Página inicial administrativa"
      navigationLabel="Navegação administrativa"
      navigation={
        <>
          {adminNavigationItems.map((item) => (
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
              <FontAwesomeIcon icon={adminIcons[item.section]} />
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
