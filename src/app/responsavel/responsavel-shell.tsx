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

type ResponsavelSection = "responsavel" | "atas" | "relatorios" | "configuracoes";

function ResponsavelNavItem({
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
      className={active ? "responsavel-nav-item responsavel-nav-item-active" : "responsavel-nav-item"}
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
    <main className="responsavel-layout">
      <aside className="responsavel-sidebar" aria-label="Navegação do responsável">
        <Link
          className="responsavel-brand"
          href="/responsavel/atas"
          aria-label="Página inicial do responsável"
          title="Página inicial do responsável"
        >
          <FontAwesomeIcon icon={faLayerGroup} />
          <span>GS Mapeamento</span>
        </Link>

        <nav className="responsavel-nav" aria-label="Seções do responsável">
          <ResponsavelNavItem
            label="Responsável"
            icon={faUser}
            href="/responsavel/atas"
            active={activeSection === "responsavel"}
          />
          <ResponsavelNavItem
            label="Atas"
            icon={faFileLines}
            href="/responsavel/atas/nova"
            active={activeSection === "atas"}
          />
          <ResponsavelNavItem
            label="Relatórios"
            icon={faChartSimple}
            href="/responsavel/relatorios"
            active={activeSection === "relatorios"}
          />
          <ResponsavelNavItem
            label="Configurações"
            icon={faGear}
            href={settingsHref}
            active={activeSection === "configuracoes"}
          />

          <form
            className="responsavel-signout-form"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="responsavel-nav-item responsavel-signout-button"
              aria-label="Sair"
              title="Sair"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span>Sair</span>
            </button>
          </form>
        </nav>
      </aside>

      <div className="responsavel-main">{children}</div>
    </main>
  );
}
