import Link from "next/link";
import { notFound } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import {
  canAccessGroup,
} from "@/lib/auth/access";
import {
  categoriaVisitanteMapping,
  formatoMapping,
  origemContatoMapping,
  plataformaMapping,
  tempoLimpoMapping,
  tipoReuniaoMapping,
} from "@/domain/enums";
import { requireAuthorizedSession } from "@/lib/auth/require-session";
import { readAggregatedAtas } from "@/lib/sheets/repository";
import { AtaIndexForm } from "./ata-index-form";

export const dynamic = "force-dynamic";

function cidadeEstado(value: string) {
  const match = value.match(/^(.*)\s+-\s+([A-Z]{2})$/);
  if (!match) return { cidade: value, estado: "—" };
  return { cidade: match[1], estado: match[2] };
}

function formatBrazilianDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export default async function AtaDetailPage({
  params,
}: {
  params: Promise<{ ataId: string }>;
}) {
  const { access } = await requireAuthorizedSession();
  const { ataId } = await params;
  const result = await readAggregatedAtas();
  const item = result.atas.find((candidate) => candidate.registro.ata.ata_id === ataId);
  if (!item) notFound();
  if (!canAccessGroup(access, item.grupo.grupo_id)) notFound();

  const { grupo, registro, indicadores } = item;
  const { ata } = registro;
  const participacaoBrasil = registro.participacao.filter((entry) => entry.pais === "Brasil");
  const membrosInternacionais = registro.participacao.filter((entry) => entry.pais !== "Brasil");
  const conquistasTempo = registro.trocas_chaveiro.flatMap((entry) =>
    Array.from({ length: entry.quantidade }, (_, index) => ({
      id: `${entry.troca_chaveiro_id}-${index}`,
      tempo: tempoLimpoMapping.toSheet(entry.tempo_limpo),
    })),
  );

  return (
    <main className="shell detail-shell">
      <header className="detail-header">
        <div>
          <Link className="button-link detail-panel-link" href="/">
            <span className="button-content">
              <FontAwesomeIcon icon={faArrowLeft} />
              Voltar
            </span>
          </Link>
          <h1>ATA {ata.indice_personalizado_grupo} - {grupo.grupo_nome}</h1>
          <p className="muted">
            {formatBrazilianDate(ata.data_reuniao)} às {ata.hora_inicio}
          </p>
        </div>
        {!grupo.ativo && <span className="badge">Grupo inativo</span>}
      </header>

      <section className="card">
        <h2>Identificação da ata</h2>
        <dl className="definition-grid">
          <div><dt>Referência do grupo</dt><dd>#{ata.indice_personalizado_grupo}</dd></div>
          <div><dt>Sequencial automático do grupo</dt><dd>{ata.numero_sequencial_grupo}</dd></div>
          <div><dt>ID interno</dt><dd>{ata.ata_id}</dd></div>
        </dl>
        <AtaIndexForm
          ataId={ata.ata_id}
          currentIndex={ata.indice_personalizado_grupo}
        />
      </section>

      <section className="card">
        <h2>Informações gerais</h2>
        <dl className="definition-grid">
          <div><dt>Preenchido por</dt><dd>{ata.preenchido_por}</dd></div>
          {ata.duracao && <div><dt>Duração</dt><dd>{ata.duracao}</dd></div>}
          <div><dt>Plataforma</dt><dd>{plataformaMapping.toSheet(ata.plataforma)}</dd></div>
          <div><dt>Tipo</dt><dd>{tipoReuniaoMapping.toSheet(ata.tipo_reuniao)}</dd></div>
          <div><dt>Membros presentes</dt><dd>{ata.total_membros_presentes}</dd></div>
          <div><dt>Partilhas</dt><dd>{ata.total_partilhas}</dd></div>
          <div><dt>Formatos</dt><dd>{ata.formatos.map((code) => formatoMapping.toSheet(code)).join(", ")}</dd></div>
          {ata.formato_outros && <div><dt>Formato outros</dt><dd>{ata.formato_outros}</dd></div>}
        </dl>
      </section>

      <section className="card">
        <h2>Indicadores</h2>
        <dl className="metrics">
          <div><dt>Localidades</dt><dd>{indicadores.total_localidades}</dd></div>
          <div><dt>Estados</dt><dd>{indicadores.total_estados}</dd></div>
          <div><dt>Países</dt><dd>{indicadores.total_paises}</dd></div>
          <div><dt>Visitantes</dt><dd>{indicadores.total_visitantes}</dd></div>
          <div><dt>Ingressos</dt><dd>{indicadores.total_ingressos}</dd></div>
          <div><dt>Conquistas de tempo</dt><dd>{indicadores.total_trocas_chaveiro}</dd></div>
          <div><dt>Membros que não indicaram localidade</dt><dd>{indicadores.membros_sem_localidade}</dd></div>
        </dl>
      </section>

      <section className="card">
        <h2>Servidores</h2>
        {registro.servidores.length === 0 ? <p className="muted">Nenhum servidor informado.</p> : (
          <ol className="list">
            {registro.servidores.map((servidor) => (
              <li key={servidor.servidor_id}>
                {servidor.nome}
                {servidor.funcao ? ` · ${servidor.funcao}` : ""}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card">
        <h2>Participação por localidade</h2>
        {participacaoBrasil.length === 0 ? <p className="muted">Nenhuma localidade válida informada.</p> : (
          <div className="table-wrap">
            <table><thead><tr><th>Localidade</th><th>Estado</th><th>País</th><th>Presenças</th></tr></thead>
              <tbody>{participacaoBrasil.map((entry) => (
                <tr key={entry.participacao_id}><td>{entry.localidade}</td><td>{entry.estado || "—"}</td><td>{entry.pais}</td><td>{entry.presencas}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Membros internacionais</h2>
        {membrosInternacionais.length === 0 ? <p className="muted">Nenhum membro internacional informado.</p> : (
          <div className="table-wrap">
            <table><thead><tr><th>País</th><th>Presenças</th></tr></thead>
              <tbody>{membrosInternacionais.map((entry) => (
                <tr key={entry.participacao_id}><td>{entry.pais}</td><td>{entry.presencas}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Visitantes</h2>
        {registro.visitantes.length === 0 ? <p className="muted">Nenhum visitante informado.</p> : (
          <div className="table-wrap">
            <table><thead><tr><th>Visitante</th><th>Cidade</th><th>Categoria</th><th>Origem</th></tr></thead>
              <tbody>{registro.visitantes.map((visitor, index) => (
                <tr key={visitor.visitante_id}><td>Visitante {index + 1}</td><td>{visitor.cidade}</td><td>{categoriaVisitanteMapping.toSheet(visitor.descricao)}</td><td>{origemContatoMapping.toSheet(visitor.como_chegou_a_na)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Ingressos</h2>
        {registro.ingressos.length === 0 ? <p className="muted">Nenhum ingresso informado.</p> : (
          <div className="table-wrap">
            <table><thead><tr><th>Ingresso</th><th>Cidade</th><th>Estado</th></tr></thead>
              <tbody>{registro.ingressos.map((entry, index) => {
                const localidade = cidadeEstado(entry.cidade);
                return (
                  <tr key={entry.ingresso_id}><td>Ingresso {index + 1}</td><td>{localidade.cidade}</td><td>{localidade.estado}</td></tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Conquistas de tempo</h2>
        {registro.trocas_chaveiro.length === 0 ? <p className="muted">Nenhuma conquista de tempo informada.</p> : (
          <div className="table-wrap">
            <table><thead><tr><th>Conquista</th><th>Tempo</th></tr></thead>
              <tbody>{conquistasTempo.map((entry, index) => (
                <tr key={entry.id}><td>Conquista {index + 1}</td><td>{entry.tempo}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
