import { requireAdminSession } from "@/lib/auth/require-session";
import { AdminShell } from "@/app/grupos/admin-shell";

type AdminPlaceholderSection = "atas" | "usuarios" | "relatorios" | "configuracoes";

export async function AdminPlaceholderPage({
  activeSection,
  title,
  description,
}: {
  activeSection: AdminPlaceholderSection;
  title: string;
  description: string;
}) {
  await requireAdminSession();

  return (
    <AdminShell activeSection={activeSection}>
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>{title}</h1>
        </div>
      </header>

      <section className="card admin-groups-card">
        <p className="empty-state">{description}</p>
      </section>
    </AdminShell>
  );
}
