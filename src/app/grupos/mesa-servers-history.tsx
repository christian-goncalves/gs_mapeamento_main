"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import type { GrupoServidorMesa } from "@/domain/schemas";
import { mesaServerClosureDetailOptions } from "@/domain/mesa-server-closure";
import { correctGrupoServidorMesaClosureAction } from "./actions";
import { MesaServerClosureDialog } from "./mesa-server-closure-dialog";

function displayDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

function orderedHistory(items: readonly GrupoServidorMesa[]) {
  return [...items].sort((first, second) =>
    second.data_inicio.localeCompare(first.data_inicio) ||
    first.encargo.localeCompare(second.encargo, "pt-BR") ||
    first.nome.localeCompare(second.nome, "pt-BR"),
  );
}

export function MesaServersHistory({
  grupoId,
  settingsHref,
  servidores,
}: {
  grupoId: string;
  settingsHref: string;
  servidores: GrupoServidorMesa[];
}) {
  const [correcting, setCorrecting] = useState<GrupoServidorMesa | null>(null);
  const items = orderedHistory(servidores);
  const detailSuggestions = mesaServerClosureDetailOptions(servidores);

  return (
    <main className="page-main mesa-history-page">
      <header className="page-header mesa-history-header">
        <div>
          <h1>Histórico de Encargos</h1>
          <p>Servidores que exerceram encargos neste grupo.</p>
        </div>
        <Link className="secondary mesa-history-back" href={settingsHref}>Voltar</Link>
      </header>
      <div className="table-wrap mesa-history-table-wrap">
        {items.length ? (
          <table className="schedule-summary-table mesa-history-table">
            <thead>
              <tr>
                <th>Encargo</th>
                <th>Servidor</th>
                <th>Desde</th>
                <th>Até</th>
                <th>Situação</th>
                <th>Motivo do encerramento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const closed = !item.ativo;
                const motive = item.motivo_encerramento === "Personalizado" || item.motivo_encerramento === "Outro"
                  ? item.motivo_encerramento_detalhe?.trim() || "—"
                  : item.motivo_encerramento ?? "—";
                return (
                  <tr key={item.grupo_servidor_mesa_id}>
                    <th scope="row">{item.encargo}</th>
                    <td>{item.nome}</td>
                    <td>{displayDate(item.data_inicio)}</td>
                    <td>{item.data_encerramento ? displayDate(item.data_encerramento) : ""}</td>
                    <td>
                      <span className={`mesa-history-status ${closed ? "mesa-history-status-closed" : "mesa-history-status-active"}`}>
                        {closed ? "Encerrado" : "Ativo"}
                      </span>
                    </td>
                    <td>{closed ? motive : ""}</td>
                    <td className="mesa-history-actions">
                      {closed && (
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Corrigir encerramento de ${item.encargo} – ${item.nome}`}
                          title="Corrigir encerramento"
                          onClick={() => setCorrecting(item)}
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">Nenhum encargo registrado.</p>
        )}
      </div>
      {correcting && (
        <MesaServerClosureDialog
          grupoId={grupoId}
          item={correcting}
          detailSuggestions={detailSuggestions}
          action={correctGrupoServidorMesaClosureAction}
          correction
          onClose={() => setCorrecting(null)}
        />
      )}
    </main>
  );
}
