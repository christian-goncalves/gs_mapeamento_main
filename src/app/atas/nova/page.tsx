import { redirect } from "next/navigation";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { listActiveGroupOptions } from "@/lib/sheets/repository";
import { ResponsavelShell } from "@/app/responsavel/responsavel-shell";
import { AtaForm } from "./ata-form";

export const dynamic = "force-dynamic";

export default async function NewAtaPage() {
  const { access } = await requireAuthorizedSession();
  if (access.role === "administrador") redirect("/admin/atas");
  const [primaryGroup] = access.groups;
  if (!primaryGroup) redirect("/login");

  const allowedGroupIds = new Set(access.groups.map((group) => group.grupo_id));
  const groups = (await listActiveGroupOptions()).filter((group) =>
    allowedGroupIds.has(group.grupo_id),
  );
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return (
    <ResponsavelShell activeSection="responsavel" settingsHref={`/grupos/${primaryGroup.grupo_id}`}>
      <header>
        <p className="eyebrow">Nova ata</p>
        <h1>{groups.length === 1 ? groups[0].grupo_nome : "Selecione o grupo"}</h1>
        <p className="muted">
          Preencha as informações da reunião com calma. Você poderá revisar tudo antes de enviar.
        </p>
      </header>
      {groups.length === 0 ? (
        <section className="card"><p>Nenhum grupo ativo disponível.</p></section>
      ) : (
        <AtaForm
          fixedGroupId={groups.length === 1 ? groups[0].grupo_id : undefined}
          groups={groups.map((group) => ({
            id: group.grupo_id,
            name: group.grupo_nome,
            plataforma: group.plataforma,
            horarios: group.horarios.map((horario) => ({
              dia_semana: horario.dia_semana,
              hora_inicio: horario.hora_inicio,
              link_reuniao: horario.link_reuniao,
            })),
          }))}
          today={today}
        />
      )}
    </ResponsavelShell>
  );
}
