"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveAtasAction } from "./approval-actions";
import type { AtaApprovalSelection } from "@/lib/sheets/approve-atas";

export type AtaApprovalRow = AtaApprovalSelection & {
  index: number;
  date: string;
  time: string;
  group: string;
};

const PAGE_SIZE = 10;

function dateLabel(date: string) {
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
}

export function AtaApprovalPanel({ rows }: { rows: AtaApprovalRow[] }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = useMemo(
    () => rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [page, rows],
  );

  if (rows.length === 0) return null;

  function changePage(nextPage: number) {
    setSelectedIds([]);
    setMessage("");
    setPage(nextPage);
  }

  function approve(selection: AtaApprovalRow[]) {
    if (selection.length === 0) return;
    const confirmation = selection
      .map((row) => `Ata ${row.index} — ${dateLabel(row.date)} às ${row.time} — ${row.group}`)
      .join("\n");
    if (!window.confirm(`Aprovar ${selection.length} ${selection.length === 1 ? "ata" : "atas"}?\n\n${confirmation}`)) return;

    const payload: AtaApprovalSelection[] = selection.map(({ ataId, updatedAt }) => ({ ataId, updatedAt }));
    startTransition(() => {
      void approveAtasAction(payload).then((result) => {
        if (result.error) {
          setMessage(result.error);
          return;
        }
        setPage(0);
        setSelectedIds([]);
        setMessage(`${result.approvedIds?.length ?? 0} ata(s) aprovada(s).`);
        router.refresh();
      });
    });
  }

  const selectedRows = visibleRows.filter((row) => selectedIds.includes(row.ataId));
  const allVisibleSelected = visibleRows.length > 0 && selectedRows.length === visibleRows.length;

  return (
    <section className="card ata-approval-panel" aria-labelledby="ata-approval-title">
      <header>
        <div>
          <p className="eyebrow">Revisão</p>
          <h2 id="ata-approval-title">Pendentes de revisão ({rows.length})</h2>
          <p>Selecione atas desta página para aprová-las em um único envio.</p>
        </div>
        <button
          className="button-primary"
          type="button"
          disabled={isPending || selectedRows.length === 0}
          onClick={() => approve(selectedRows)}
        >
          {isPending ? "Aprovando…" : `Aprovar selecionadas (${selectedRows.length})`}
        </button>
      </header>
      {message && <p className="ata-approval-feedback" role="status">{message}</p>}
      <div className="ata-approval-list">
        <div className="ata-approval-list-heading">
          <label>
            <input
              type="checkbox"
              checked={allVisibleSelected}
              disabled={isPending}
              onChange={(event) => setSelectedIds(event.target.checked ? visibleRows.map((row) => row.ataId) : [])}
            />
            Selecionar página
          </label>
          <span>{selectedRows.length} selecionada(s)</span>
        </div>
        {visibleRows.map((row) => (
          <article className="ata-approval-row" key={row.ataId}>
            <label>
              <input
                type="checkbox"
                checked={selectedIds.includes(row.ataId)}
                disabled={isPending}
                onChange={(event) => setSelectedIds((current) => event.target.checked
                  ? [...current, row.ataId]
                  : current.filter((id) => id !== row.ataId))}
              />
              <span>
                <strong>Ata {row.index} · {row.group}</strong>
                <small>{dateLabel(row.date)} às {row.time}</small>
              </span>
            </label>
            <div className="ata-approval-row-actions">
              <Link href={`/atas/${row.ataId}`}>Ver ata</Link>
              <button type="button" disabled={isPending} onClick={() => approve([row])}>Aprovar</button>
            </div>
          </article>
        ))}
      </div>
      {pageCount > 1 && (
        <nav className="ata-approval-pagination" aria-label="Páginas de atas pendentes">
          <button type="button" disabled={page === 0 || isPending} onClick={() => changePage(page - 1)}>Anterior</button>
          <span>Página {page + 1} de {pageCount}</span>
          <button type="button" disabled={page + 1 >= pageCount || isPending} onClick={() => changePage(page + 1)}>Próxima</button>
        </nav>
      )}
    </section>
  );
}
