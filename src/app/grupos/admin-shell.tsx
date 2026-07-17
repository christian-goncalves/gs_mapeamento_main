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

function DisabledNavItem({
  label,
  icon,
}: {
  label: string;
  icon: Parameters<typeof FontAwesomeIcon>[0]["icon"];
}) {
  return (
    <button
      type="button"
      className="admin-nav-item admin-nav-item-disabled"
      aria-disabled="true"
      aria-label={`${label} indisponível neste ciclo`}
      title={`${label} será implementado depois`}
      disabled
    >
      <FontAwesomeIcon icon={icon} />
      <span>{label}</span>
    </button>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="admin-layout">
      <aside className="admin-sidebar" aria-label="Navegação administrativa">
        <div className="admin-brand" aria-label="GS Mapeamento">
          <FontAwesomeIcon icon={faLayerGroup} />
          <span>GS Mapeamento</span>
        </div>

        <nav className="admin-nav" aria-label="Seções administrativas">
          <Link
            className="admin-nav-item admin-nav-item-active"
            href="/grupos"
            aria-current="page"
            aria-label="Grupos"
            title="Grupos"
          >
            <FontAwesomeIcon icon={faLayerGroup} />
            <span>Grupos</span>
          </Link>
          <DisabledNavItem label="Atas" icon={faFileLines} />
          <DisabledNavItem label="Usuários" icon={faUser} />
          <DisabledNavItem label="Relatórios" icon={faChartSimple} />
          <DisabledNavItem label="Configurações" icon={faGear} />
        </nav>

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
      </aside>

      <div className="admin-main">{children}</div>
    </main>
  );
}
