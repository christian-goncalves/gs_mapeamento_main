import { AdminPlaceholderPage } from "../admin-placeholder-page";

export const dynamic = "force-dynamic";

export default function AdminUsuariosPage() {
  return (
    <AdminPlaceholderPage
      activeSection="usuarios"
      title="Usuários"
      description="A gestão administrativa de usuários será implementada em etapa futura."
    />
  );
}
