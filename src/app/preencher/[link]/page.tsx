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
    <main className="shell form-shell public-ata-page">
      <header className="responsavel-page-header">
        <div>
          <p className="eyebrow">Nova ata</p>
          <h1>Grupo {group.group.grupo_nome}</h1>
          <p className="responsavel-page-description">
            Preencha as informações da reunião com calma. Você poderá revisar tudo antes de enviar.
          </p>
        </div>
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
            plataforma: group.group.plataforma,
            fuso_horario: group.group.fuso_horario,
            plataformas: group.plataformas.map((platform) => platform.tipo),
            funcoesServidor: group.funcoesServidor.map((funcao) => funcao.nome),
            horarios: group.horarios.map((horario) => ({
              dia_semana: horario.dia_semana,
              hora_inicio: horario.hora_inicio,
              link_reuniao: horario.link_reuniao,
              plataformaTipo: group.plataformas.find((platform) => platform.plataforma_id === horario.plataforma_id)?.tipo,
            })),
          },
        ]}
      />
    </main>
  );
}
