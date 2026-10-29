import { redirect } from "next/navigation";
import { requireAuthorizedSessionWithAggregatedAtas } from "@/lib/auth/require-session";
import { ResponsavelShell } from "@/app/responsavel/responsavel-shell";
import { AtaForm } from "./ata-form";

export const dynamic = "force-dynamic";

export default async function NewAtaPage() {
  const { access, result } = await requireAuthorizedSessionWithAggregatedAtas();
  if (access.role === "administrador") redirect("/admin/atas");
  const [primaryGroup] = access.groups;
  if (!primaryGroup) redirect("/login");

  const allowedGroupIds = new Set(access.groups.map((group) => group.grupo_id));
  const groups = result.grupos
    .filter((group) => group.ativo && allowedGroupIds.has(group.grupo_id))
    .sort((first, second) =>
      first.grupo_nome.localeCompare(second.grupo_nome, "pt-BR"),
    )
    .map((group) => ({
      ...group,
      horarios: result.grupo_horarios.filter(
        (horario) => horario.grupo_id === group.grupo_id && horario.ativo,
      ),
    }));
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return (
    <ResponsavelShell activeSection="responsavel" settingsHref={`/grupos/${primaryGroup.grupo_id}`}>
      <div className="responsavel-config-page">
        <header className="responsavel-page-header">
          <div>
            <p className="eyebrow">Nova ata</p>
            <h1>{groups.length === 1 ? `Grupo ${groups[0].grupo_nome}` : "Selecione o grupo"}</h1>
            <p className="responsavel-page-description">
              Preencha as informações da reunião com calma. Você poderá revisar tudo antes de enviar.
            </p>
          </div>
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
              fuso_horario: group.fuso_horario,
              plataformas: result.grupo_plataformas.filter((item) => item.grupo_id === group.grupo_id && item.ativo).map((item) => item.tipo),
              funcoesServidor: (result.grupo_funcoes_servidor ?? [])
                .filter((item) => item.grupo_id === group.grupo_id && item.ativo)
                .map((item) => item.nome),
              horarios: group.horarios.map((horario) => ({
                dia_semana: horario.dia_semana,
                hora_inicio: horario.hora_inicio,
                link_reuniao: horario.link_reuniao,
                plataformaTipo: result.grupo_plataformas.find((item) => item.plataforma_id === horario.plataforma_id && item.ativo)?.tipo,
              })),
            }))}
            today={today}
          />
        )}
      </div>
    </ResponsavelShell>
  );
}
