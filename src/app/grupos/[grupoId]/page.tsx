import { notFound } from "next/navigation";
import { requireGroupSession } from "@/lib/auth/require-session";
import { getPendingActivationForGroup } from "@/lib/sheets/group-users";
import { readAggregatedAtas } from "@/lib/sheets/repository";
import { GroupEditor } from "../group-editor";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ grupoId: string }>;
  searchParams?: Promise<{ status?: string }>;
}) {
  const { grupoId } = await params;
  const status = (await searchParams)?.status;
  const { access } = await requireGroupSession(grupoId);
  const result = await readAggregatedAtas();
  const group = result.grupos.find((item) => item.grupo_id === grupoId);
  if (!group) notFound();
  const horarios = result.grupo_horarios.filter(
    (horario) => horario.grupo_id === grupoId,
  );
  const pendingActivation =
    access.role === "administrador"
      ? await getPendingActivationForGroup(grupoId)
      : null;
  return (
    <GroupEditor
      group={group}
      horarios={horarios}
      canCreate={access.role === "administrador"}
      canManageAccess={access.role === "administrador"}
      activationPath={
        pendingActivation
          ? `/ativar-acesso/${pendingActivation.convite_token}`
          : ""
      }
      status={status}
    />
  );
}
