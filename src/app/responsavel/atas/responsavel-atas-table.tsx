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
import type { ConfigColumns } from "datatables.net";

type ResponsavelAtaTab = "enviadas" | "por-servidor" | "todas";

export type ResponsavelAtaRow = {
  ataId: string;
  indicePersonalizadoGrupo: number;
  data: string;
  horario: string;
  servidor: string;
  status: "Enviada";
};

const tabLabels: Record<ResponsavelAtaTab, string> = {
  enviadas: "Atas enviadas",
  "por-servidor": "Por servidor",
  todas: "Todas",
};

const statusLegend = [
  { label: "Enviada", className: "responsavel-status-dot-sent" },
  { label: "Pendente de revisão", className: "responsavel-status-dot-review" },
  { label: "Não enviada", className: "responsavel-status-dot-missing" },
] as const;

type ResponsavelAtaDataTableRow = [
  string,
  string,
  string,
  string,
  ResponsavelAtaRow["status"],
  ResponsavelAtaRow,
];
type DataTableComponent = typeof import("datatables.net-react").default;

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}-${month}-${year}`;
}

function formatMobileDate(value: string) {
  const [, month, day] = value.split("-");
  if (!month || !day) return value;
  return `${day}-${month}`;
}

function ResponsavelAtaActions({ ata }: { ata: ResponsavelAtaRow }) {
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
              <Link
                className="responsavel-action-menu-item"
                href={`/atas/${ata.ataId}`}
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
              <button
                type="button"
                className="responsavel-action-menu-item"
                role="menuitem"
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

function sortRows(rows: ResponsavelAtaRow[], tab: ResponsavelAtaTab) {
  if (tab === "por-servidor") {
    return [...rows].sort(
      (first, second) =>
        first.servidor.localeCompare(second.servidor, "pt-BR") ||
        second.data.localeCompare(first.data) ||
        second.horario.localeCompare(first.horario),
    );
  }

  return [...rows].sort(
    (first, second) =>
      second.data.localeCompare(first.data) ||
      second.horario.localeCompare(first.horario),
  );
}

function toDataTableRows(rows: ResponsavelAtaRow[]): ResponsavelAtaDataTableRow[] {
  return rows.map((row) => [
    `#${row.indicePersonalizadoGrupo}`,
    row.data,
    row.horario,
    row.servidor || "Sem servidor",
    row.status,
    row,
  ]);
}

const columns: ConfigColumns[] = [
  {
    title: "Ata",
    className: "responsavel-centered-column responsavel-ata-number-column",
  },
  { title: "Data", className: "responsavel-data-column" },
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
    orderable: false,
  },
  {
    title: "Ações",
    className: "responsavel-centered-column responsavel-actions-column",
    orderable: false,
    searchable: false,
  },
];

export function ResponsavelAtasTable({ rows }: { rows: ResponsavelAtaRow[] }) {
  const [DataTableComponent, setDataTableComponent] =
    useState<DataTableComponent | null>(null);
  const [activeTab, setActiveTab] = useState<ResponsavelAtaTab>("enviadas");
  const tabs = ["enviadas", "por-servidor", "todas"] as const;

  const tableRows = useMemo(
    () => toDataTableRows(sortRows(rows, activeTab)),
    [activeTab, rows],
  );

  function updateTab(tab: ResponsavelAtaTab) {
    setActiveTab(tab);
  }

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
      <div className="status-tabs" role="tablist" aria-label="Filtrar atas">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "status-tab status-tab-active" : "status-tab"}
            onClick={() => updateTab(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <div className="responsavel-status-legend" aria-label="Legenda dos status">
        <span className="responsavel-status-legend-title">Status:</span>
        {statusLegend.map((status) => (
          <span className="responsavel-status-legend-item" key={status.label}>
            <span
              className={`responsavel-status-dot ${status.className}`}
              aria-hidden="true"
            />
            {status.label}
          </span>
        ))}
      </div>

      <div className="responsavel-table-wrap">
        {DataTableComponent ? (
          <DataTableComponent
            key={activeTab}
            className="responsavel-atas-table"
            columns={columns}
            data={tableRows}
            options={{
              autoWidth: false,
              ordering: true,
              order: activeTab === "por-servidor" ? [[3, "asc"], [1, "desc"]] : [[1, "desc"]],
              orderFixed: { post: [[2, "asc"]] },
              pageLength: 10,
              lengthMenu: [10, 25, 50],
              language: {
                decimal: ",",
                emptyTable: "Nenhuma ata encontrada.",
                info: "_START_ - _END_ de _TOTAL_",
                infoEmpty: "0 - 0 de 0",
                infoFiltered: "(filtrado de _MAX_ atas)",
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
                zeroRecords: "Nenhuma ata encontrada.",
              },
            }}
            slots={{
              1: (data: string, row: ResponsavelAtaDataTableRow) => (
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
              4: (data: ResponsavelAtaRow["status"]) => (
                <span
                  className="responsavel-status-dot responsavel-status-dot-sent"
                  role="img"
                  aria-label={`Status: ${data}`}
                  title={data}
                />
              ),
              5: (_data: ResponsavelAtaRow, row: ResponsavelAtaDataTableRow) => {
                const ata = row[5];

                return (
                  <div
                    className="row-actions responsavel-ata-actions"
                  >
                    <ResponsavelAtaActions ata={ata} />
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
