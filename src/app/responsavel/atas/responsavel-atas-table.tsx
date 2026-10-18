"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisVertical,
  faEye,
  faPenToSquare,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { AtaPdfDownloadButton } from "@/app/atas/ata-pdf-download-button";
import { AtaDeleteAction } from "@/app/atas/ata-delete-action";
import type { ConfigColumns } from "datatables.net";
import type { ResponsavelAtaRow, ResponsavelAtaStatus } from "./responsavel-atas-data";

type ResponsavelAtaDataTableRow = [
  number | null,
  string,
  string,
  string,
  ResponsavelAtaStatus,
  ResponsavelAtaRow,
];
type DataTableComponent = typeof import("datatables.net-react").default;

const activeStatusOptions: { value: "todos" | ResponsavelAtaStatus; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "Enviada", label: "Enviadas" },
  { value: "Não enviada", label: "Não enviadas" },
  { value: "Pendente de revisão", label: "Pendentes de revisão" },
];
const historyStatusOptions: { value: "todos" | ResponsavelAtaStatus; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "Substituída", label: "Substituídas" },
  { value: "Excluída", label: "Excluídas" },
];

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatMobileDate(value: string) {
  const [, month, day] = value.split("-");
  if (!month || !day) return value;
  return `${day}/${month}`;
}

function ResponsavelAtaActions({
  ata,
  navigationQuery,
}: {
  ata: ResponsavelAtaRow & { ataId: string };
  navigationQuery: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const dateLabel = formatDate(ata.data);

  function updatePosition() {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = Math.min(224, window.innerWidth - 16);
    const menuHeight = menuRef.current?.offsetHeight ?? 188;
    const left = Math.min(
      window.innerWidth - menuWidth - 8,
      Math.max(8, rect.right - menuWidth),
    );
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow >= menuHeight + 8
        ? rect.bottom + 8
        : Math.max(8, rect.top - menuHeight - 8);

    setPosition({ top, left });
  }

  function toggleMenu() {
    if (!open) updatePosition();
    setOpen((current) => !current);
  }

  useEffect(() => {
    if (!open) return;

    updatePosition();

    function closeOnPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target) &&
        !document.querySelector(".ata-delete-modal")?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }

    function repositionMenu() {
      updatePosition();
    }

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", repositionMenu);
    window.addEventListener("scroll", repositionMenu, true);

    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", repositionMenu);
      window.removeEventListener("scroll", repositionMenu, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="responsavel-action-menu-trigger"
        aria-label={`Abrir ações da ata de ${dateLabel}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title="Ações"
        onClick={toggleMenu}
      >
        <FontAwesomeIcon icon={faEllipsisVertical} />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              className="responsavel-action-menu"
              role="menu"
              aria-label={`Ações da ata de ${dateLabel}`}
              style={{ top: position.top, left: position.left }}
            >
              <Link
                className="responsavel-action-menu-item"
                href={`/atas/${ata.ataId}?${navigationQuery}`}
                role="menuitem"
              >
                <FontAwesomeIcon icon={faEye} />
                <span>Visualizar</span>
              </Link>
              <AtaPdfDownloadButton
                ataId={ata.ataId}
                onComplete={() => setOpen(false)}
                compact
              />
              {ata.canEdit ? (
                <Link
                  className="responsavel-action-menu-item"
                  href={`/atas/${ata.ataId}/editar`}
                  role="menuitem"
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                  <span>Editar</span>
                </Link>
              ) : null}
              {ata.canDelete ? (
                <AtaDeleteAction
                  ataId={ata.ataId}
                  updatedAt={ata.updatedAt}
                  onComplete={() => setOpen(false)}
                />
              ) : (
                <button
                  type="button"
                  className="responsavel-action-menu-item responsavel-action-menu-item-danger"
                  role="menuitem"
                  disabled
                  title={ata.status === "Pendente de revisão" ? "Aprove a ata antes de excluí-la." : "Disponível somente para atas ativas e aprovadas."}
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                  <span>Excluir</span>
                  <small>{ata.status === "Pendente de revisão" ? "Aprove primeiro" : "Indisponível"}</small>
                </button>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function toDataTableRows(rows: ResponsavelAtaRow[]): ResponsavelAtaDataTableRow[] {
  return rows.map((row) => [
    row.indicePersonalizadoGrupo,
    row.data,
    row.horario,
    row.servidor || (row.status === "Não enviada" ? "-" : "Sem servidor"),
    row.status,
    row,
  ]);
}

function statusClassName(status: ResponsavelAtaStatus) {
  if (status === "Pendente de revisão") return "responsavel-status-dot-review";
  if (status === "Não enviada") return "responsavel-status-dot-missing";
  if (status === "Substituída" || status === "Excluída") return "responsavel-status-dot-history";
  return "responsavel-status-dot-sent";
}

const columns: ConfigColumns[] = [
  {
    title: "Ata",
    className: "responsavel-centered-column responsavel-ata-number-column",
  },
  {
    title: "Data",
    className: "responsavel-data-column",
    orderData: [1, 2],
  },
  {
    title: "Horário",
    className: "responsavel-centered-column responsavel-time-column",
  },
  {
    title: "Preenchido por",
    className: "responsavel-centered-column responsavel-server-column",
  },
  {
    title: "Status",
    className: "responsavel-centered-column responsavel-status-column",
  },
  {
    title: "Ações",
    className: "responsavel-centered-column responsavel-actions-column",
    orderable: false,
    searchable: false,
  },
];

export function ResponsavelAtasTable({
  rows,
  historyMode,
  defaultStartDate,
  defaultEndDate,
}: {
  rows: ResponsavelAtaRow[];
  historyMode: boolean;
  defaultStartDate: string;
  defaultEndDate: string;
}) {
  const [DataTableComponent, setDataTableComponent] =
    useState<DataTableComponent | null>(null);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedTime, setSelectedTime] = useState("todos");
  const [selectedStatus, setSelectedStatus] = useState<"todos" | ResponsavelAtaStatus>("todos");
  const [tableOrder, setTableOrder] = useState("0.desc");
  const statusOptions = historyMode ? historyStatusOptions : activeStatusOptions;
  const modeRows = useMemo(
    () => rows.filter((row) => historyMode
      ? row.ataId !== null && row.registroStatus !== "ativa"
      : row.registroStatus === "ativa"),
    [rows, historyMode],
  );

  const timeOptions = useMemo(
    () => [...new Set(modeRows.map((row) => row.horario))].sort(),
    [modeRows],
  );
  const filteredRows = useMemo(
    () => modeRows.filter((row) =>
      row.data >= startDate
      && row.data <= endDate
      && (selectedTime === "todos" || row.horario === selectedTime)
      && (selectedStatus === "todos" || row.status === selectedStatus)
    ),
    [modeRows, startDate, endDate, selectedTime, selectedStatus],
  );

  const tableRows = useMemo(
    () => toDataTableRows(filteredRows),
    [filteredRows],
  );
  const navigationQuery = useMemo(() => new URLSearchParams({
    origem: historyMode ? "historico" : "responsavel",
    de: startDate,
    ate: endDate,
    horario: selectedTime,
    status: selectedStatus,
    ordem: tableOrder,
  }).toString(), [historyMode, startDate, endDate, selectedTime, selectedStatus, tableOrder]);

  useEffect(() => {
    let mounted = true;

    async function loadDataTable() {
      const [{ default: DataTable }, { default: DT }] = await Promise.all([
        import("datatables.net-react"),
        import("datatables.net-dt"),
      ]);
      DataTable["use"](DT);
      if (mounted) setDataTableComponent(() => DataTable);
    }

    void loadDataTable();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="card responsavel-atas-card">
      <div className="responsavel-atas-filters" aria-label="Filtros das atas">
        <label>
          <span>De</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label>
          <span>Até</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <label>
          <span>Horário</span>
          <select value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)}>
            <option value="todos">Todos</option>
            {timeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value as "todos" | ResponsavelAtaStatus)}
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="responsavel-table-wrap">
        {DataTableComponent ? (
          <DataTableComponent
            className="responsavel-atas-table"
            columns={columns}
            data={tableRows}
            key={`${startDate}-${endDate}-${selectedTime}-${selectedStatus}`}
            options={{
              autoWidth: false,
              ordering: true,
              order: [[0, "desc"]],
              pageLength: 25,
              searching: false,
              lengthChange: false,
              layout: {
                topStart: null,
                topEnd: null,
                bottomStart: "info",
                bottomEnd: "paging",
              },
              language: {
                decimal: ",",
                emptyTable: "Nenhuma ata encontrada.",
                info: "_START_ - _END_ de _TOTAL_",
                infoEmpty: "0 - 0 de 0",
                infoFiltered: "(filtrado de _MAX_ atas)",
                loadingRecords: "Carregando...",
                paginate: {
                  first: "Primeira",
                  last: "Última",
                  next: "Próxima",
                  previous: "Anterior",
                },
                zeroRecords: "Nenhuma ata encontrada.",
              },
            }}
            onOrder={(_event: Event, settings: unknown) => {
              const sorting = (settings as { aaSorting?: [number, number | string][] }).aaSorting ?? [];
              const encoded = sorting
                .map(([column, direction]) => `${column}.${direction === 1 || direction === "asc" ? "asc" : "desc"}`)
                .join(",");
              if (encoded) setTableOrder(encoded);
            }}
            slots={{
              0: (data: number | null) =>
                data === null ? "-" : (data >= 1 && data <= 9 ? `0${data}` : `${data}`),
              1: (
                data: string,
                type: string,
                row: ResponsavelAtaDataTableRow,
              ) => type !== "display" ? data : (
                <>
                  <span className="responsavel-date-desktop">{formatDate(data)}</span>
                  <span className="responsavel-date-mobile">
                    {formatMobileDate(data)} <span aria-hidden="true">|</span>{" "}
                    {row[2]}
                  </span>
                </>
              ),
              3: (data: string) => (
                <span className="responsavel-server-name" title={data}>
                  {data}
                </span>
              ),
              4: (data: ResponsavelAtaStatus) => {
                if (historyMode) return <span className={`responsavel-history-status ${data === "Substituída" ? "is-substituted" : "is-deleted"}`}>{data}</span>;
                return (
                  <span
                    className={`responsavel-status-dot ${statusClassName(data)}`}
                    role="img"
                    aria-label={`Status: ${data}`}
                    title={data}
                  />
                );
              },
              5: (_data: ResponsavelAtaRow, row: ResponsavelAtaDataTableRow) => {
                const ata = row[5];
                if (!ata.ataId) return <span aria-hidden="true" />;

                return (
                  <div
                    className="row-actions responsavel-ata-actions"
                  >
                    <ResponsavelAtaActions
                      ata={ata as ResponsavelAtaRow & { ataId: string }}
                      navigationQuery={navigationQuery}
                    />
                  </div>
                );
              },
            }}
          >
            <thead>
              <tr>
                <th>Ata</th>
                <th>Data</th>
                <th>Horário</th>
                <th>Preenchido por</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
          </DataTableComponent>
        ) : (
          <p className="empty-state" role="status">Carregando tabela...</p>
        )}
      </div>
    </section>
  );
}
