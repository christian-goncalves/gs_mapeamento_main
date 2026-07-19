import type { ReactNode } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartSimple,
  faFileLines,
  faGear,
  faLayerGroup,
  faRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { signOut } from "@/auth";

type AdminSection = "grupos" | "atas" | "usuarios" | "relatorios" | "configuracoes";

function NavItem({
  label,
  icon,
  href,
  active,
}: {
  label: string;
  icon: Parameters<typeof FontAwesomeIcon>[0]["icon"];
  href: string;
  active: boolean;
}) {
  return (
    <Link
      className={active ? "admin-nav-item admin-nav-item-active" : "admin-nav-item"}
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      title={label}
    >
      <FontAwesomeIcon icon={icon} />
      <span>{label}</span>
    </Link>
  );
}

export function AdminShell({
  children,
  activeSection = "grupos",
}: {
  children: ReactNode;
  activeSection?: AdminSection;
}) {
  return (
    <main className="admin-layout">
      <aside className="admin-sidebar" aria-label="Navegação administrativa">
        <div className="admin-brand" aria-label="GS Mapeamento">
          <FontAwesomeIcon icon={faLayerGroup} />
          <span>GS Mapeamento</span>
        </div>

        <nav className="admin-nav" aria-label="Seções administrativas">
          <NavItem
            label="Grupos"
            icon={faLayerGroup}
            href="/admin/grupos"
            active={activeSection === "grupos"}
          />
          <NavItem
            label="Atas"
            icon={faFileLines}
            href="/admin/atas"
            active={activeSection === "atas"}
          />
          <NavItem
            label="Usuários"
            icon={faUser}
            href="/admin/usuarios"
            active={activeSection === "usuarios"}
          />
          <NavItem
            label="Relatórios"
            icon={faChartSimple}
            href="/admin/relatorios"
            active={activeSection === "relatorios"}
          />
          <NavItem
            label="Configurações"
            icon={faGear}
            href="/admin/configuracoes"
            active={activeSection === "configuracoes"}
          />

          <form
            className="admin-signout-form"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="admin-nav-item admin-signout-button"
              aria-label="Sair"
              title="Sair"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span>Sair</span>
            </button>
          </form>
        </nav>
      </aside>

      <div className="admin-main">{children}</div>
    </main>
  );
}
