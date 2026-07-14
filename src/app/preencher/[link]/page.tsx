import { notFound } from "next/navigation";
import { getActiveGroupByAtaLink } from "@/lib/sheets/repository";
import { AtaForm } from "@/app/atas/nova/ata-form";
import { createAtaByLinkAction } from "@/app/atas/nova/actions";

export const dynamic = "force-dynamic";

export default async function PublicAtaPage({
  params,
}: {
  params: Promise<{ link: string }>;
}) {
  const { link } = await params;
  const group = await getActiveGroupByAtaLink(link);
  if (!group) notFound();
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return (
    <main className="shell form-shell">
      <header>
        <p className="eyebrow">Ata do grupo</p>
        <h1>{group.group.grupo_nome}</h1>
        <p className="muted">Preencha e confirme a ata desta reunião.</p>
      </header>
      <AtaForm
        action={createAtaByLinkAction}
        fixedGroupId={group.group.grupo_id}
        linkFormularioAta={link}
        today={today}
        groups={[
          {
            id: group.group.grupo_id,
            name: group.group.grupo_nome,
            horarios: group.horarios.map((horario) => ({
              dia_semana: horario.dia_semana,
              hora_inicio: horario.hora_inicio,
              link_reuniao: horario.link_reuniao,
            })),
          },
        ]}
      />
    </main>
  );
}
