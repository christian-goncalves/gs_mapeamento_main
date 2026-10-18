"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisVertical,
  faEye,
  faFilePdf,
  faPenToSquare,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import type { ConfigColumns } from "datatables.net";
import type { AdminAtaRow, AdminAtaStatus } from "./admin-atas-data";

type AdminAtaDataTableRow = [
  string,
  string,
  string,
  string,
  AdminAtaStatus,
  AdminAtaRow,
];
type DataTableComponent = typeof import("datatables.net-react").default;

export const DEFAULT_ADMIN_ATA_STATUS_FILTER = "todos" as const;

const statusOptions: { value: "todos" | AdminAtaStatus; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "Enviada", label: "Enviadas" },
  { value: "Não enviada", label: "Não enviadas" },
  { value: "Pendente de revisão", label: "Pendentes de revisão" },
];

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}-${month}-${year}`;
}

function formatMobileDate(value: string) {
  const [, month, day] = value.split("-");
  if (!month || !day) return value;
  return `${day}/${month}`;
}

function formatTabletDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

export function toAdminAtaDataTableRows(
  rows: AdminAtaRow[],
): AdminAtaDataTableRow[] {
  return rows.map((row) => [
    row.indicePersonalizadoGrupo ? `#${row.indicePersonalizadoGrupo}` : "-",
    row.data,
    row.horario,
    row.grupo,
    row.status,
    row,
  ]);
}

function statusToneClass(status: AdminAtaStatus) {
  if (status === "Pendente de revisão") return "admin-status-review";
  if (status === "Não enviada") return "admin-status-missing";
  return "admin-status-sent";
}

function AdminAtaStatus({ status }: { status: AdminAtaStatus }) {
  return (
    <span
      className={`admin-status-display ${statusToneClass(status)}`}
      aria-label={`Status: ${status}`}
      title={status}
    >
      <span className="admin-status-dot" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}

function AdminAtaActions({ ata, navigationQuery }: { ata: AdminAtaRow; navigationQuery: string }) {
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
    const menuHeight = menuRef.current?.offsetHeight ?? 232;
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
        !menuRef.current?.contains(target)
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
              <div className="admin-ata-action-context" role="note">
                <span>Status</span>
                <AdminAtaStatus status={ata.status} />
              </div>
              <div className="admin-ata-action-context" role="note">
                <span>Preenchido por</span>
                <strong>{ata.preenchidoPor || "Não informado"}</strong>
              </div>
              {ata.ataId ? (
                <Link
                  className="responsavel-action-menu-item"
                  href={`/atas/${ata.ataId}?${navigationQuery}`}
                  role="menuitem"
                  aria-label={`Visualizar ata de ${dateLabel} às ${ata.horario}`}
                >
                  <FontAwesomeIcon icon={faEye} />
                  <span>Visualizar</span>
                </Link>
              ) : (
                <button
                  type="button"
                  className="responsavel-action-menu-item"
                  role="menuitem"
                  aria-label="Visualizar ata indisponível"
                  disabled
                >
                  <FontAwesomeIcon icon={faEye} />
                  <span>Visualizar</span>
                  <small>Indisponível</small>
                </button>
              )}
              <button
                type="button"
                className="responsavel-action-menu-item"
                role="menuitem"
                title="Gerar PDF será implementado em ciclo próprio"
                disabled
              >
                <FontAwesomeIcon icon={faFilePdf} />
                <span>Gerar PDF</span>
                <small>Indisponível</small>
              </button>
              <button
                type="button"
                className="responsavel-action-menu-item"
                role="menuitem"
                title="Editar ata será implementado em ciclo próprio"
                disabled
              >
                <FontAwesomeIcon icon={faPenToSquare} />
                <span>Editar</span>
                <small>Indisponível</small>
              </button>
              <button
                type="button"
                className="responsavel-action-menu-item responsavel-action-menu-item-danger"
                role="menuitem"
                title="Excluir ata será implementado em ciclo próprio"
                disabled
              >
                <FontAwesomeIcon icon={faTrashCan} />
                <span>Excluir</span>
                <small>Indisponível</small>
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

const columns: ConfigColumns[] = [
  { title: "Ata", className: "responsavel-centered-column" },
  {
    title: "Data",
    className: "responsavel-data-column",
    render: (data: string, type: string) => {
      if (type === "display") return formatDate(data);
      if (type === "filter") return `${formatDate(data)} ${data}`;
      return data;
    },
  },
  {
    title: "Horário",
    className: "responsavel-centered-column admin-time-column",
  },
  {
    title: "Grupo",
    className: "responsavel-centered-column admin-group-column",
  },
  {
    title: "Status",
    className: "responsavel-centered-column admin-status-column",
    orderable: false,
  },
  {
    title: "Ações",
    className: "responsavel-centered-column admin-actions-column",
    orderable: false,
    searchable: false,
  },
];

export function AdminAtasTable({
  rows,
  monthStart,
  monthEnd,
}: {
  rows: AdminAtaRow[];
  monthStart: string;
  monthEnd: string;
}) {
  const [DataTableComponent, setDataTableComponent] =
    useState<DataTableComponent | null>(null);
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(monthEnd);
  const [groupId, setGroupId] = useState("todos");
  const [filledBy, setFilledBy] = useState("");
  const [status, setStatus] = useState<"todos" | AdminAtaStatus>(
    DEFAULT_ADMIN_ATA_STATUS_FILTER,
  );
  const [tableOrder, setTableOrder] = useState("1.desc");

  const groups = useMemo(
    () =>
      [...new Map(rows.map((row) => [row.grupoId, row.grupo])).entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((first, second) => first.name.localeCompare(second.name, "pt-BR")),
    [rows],
  );
  const normalizedFilledBy = normalize(filledBy);

  const filteredRows = useMemo(
    () =>
      rows
        .filter((row) => {
          if (startDate && row.data < startDate) return false;
          if (endDate && row.data > endDate) return false;
          if (groupId !== "todos" && row.grupoId !== groupId) return false;
          if (status !== "todos" && row.status !== status) return false;
          if (normalizedFilledBy && !normalize(row.preenchidoPor).includes(normalizedFilledBy)) {
            return false;
          }
          return true;
        })
        .sort(
          (first, second) =>
            second.data.localeCompare(first.data) ||
            first.horario.localeCompare(second.horario) ||
            first.grupo.localeCompare(second.grupo, "pt-BR"),
        ),
    [endDate, groupId, normalizedFilledBy, rows, startDate, status],
  );

  const tableRows = useMemo(
    () => toAdminAtaDataTableRows(filteredRows),
    [filteredRows],
  );
  const navigationQuery = useMemo(() => new URLSearchParams({
    origem: "admin",
    de: startDate,
    ate: endDate,
    grupo: groupId,
    preenchido: filledBy,
    status,
    ordem: tableOrder,
  }).toString(), [startDate, endDate, groupId, filledBy, status, tableOrder]);

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
    <section className="card admin-atas-card">
      <div className="admin-atas-filters" aria-label="Filtros das atas administrativas">
        <label>
          De
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label>
          Até
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <label>
          Grupo
          <select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
            <option value="todos">Todos</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Preenchido por
          <input
            type="search"
            value={filledBy}
            onChange={(event) => setFilledBy(event.target.value)}
            placeholder="Nome ou e-mail"
          />
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "todos" | AdminAtaStatus)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="responsavel-table-wrap admin-atas-table-wrap">
        {DataTableComponent ? (
        <DataTableComponent
          key={`${startDate}-${endDate}-${groupId}-${filledBy}-${status}`}
          className="responsavel-atas-table admin-atas-table"
          columns={columns}
          data={tableRows}
          options={{
            autoWidth: false,
            ordering: true,
            order: [[1, "desc"]],
            orderFixed: { post: [[2, "asc"]] },
            pageLength: 10,
            lengthMenu: [10, 25, 50],
            language: {
              decimal: ",",
              emptyTable: "Nenhuma ata encontrada.",
              info: "_START_ - _END_ de _TOTAL_",
              infoEmpty: "0 - 0 de 0",
              infoFiltered: "(filtrado de _MAX_ registros)",
              lengthMenu: "Mostrar _MENU_",
              loadingRecords: "Carregando...",
              paginate: {
                first: "Primeira",
                last: "Última",
                next: "Próxima",
                previous: "Anterior",
              },
              search: "Buscar:",
              searchPlaceholder: "Buscar...",
              zeroRecords: "Nenhum registro encontrado.",
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
            1: (data: string, row: AdminAtaDataTableRow) => (
              <>
                <span className="admin-date-desktop">{formatDate(data)}</span>
                <span className="admin-date-tablet">
                  {formatTabletDate(data)} <span aria-hidden="true">|</span>{" "}
                  {row[2]}
                </span>
                <span className="admin-date-mobile">
                  {formatMobileDate(data)} <span aria-hidden="true">|</span>{" "}
                  {row[2]}
                </span>
              </>
            ),
            3: (data: string) => (
              <span className="admin-group-name" title={data}>
                {data}
              </span>
            ),
            4: (data: AdminAtaStatus) => <AdminAtaStatus status={data} />,
            5: (_data: AdminAtaRow, row: AdminAtaDataTableRow) => {
              const ata = row[5];
              const dateLabel = formatDate(ata.data);

              return (
                <div
                  className="row-actions responsavel-ata-actions"
                  aria-label={`Ações da ata de ${dateLabel}`}
                >
                  <AdminAtaActions ata={ata} navigationQuery={navigationQuery} />
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
              <th>Grupo</th>
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
