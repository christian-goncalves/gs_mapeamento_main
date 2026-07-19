"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
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
  string,
  AdminAtaStatus,
  AdminAtaRow,
];
type DataTableComponent = typeof import("datatables.net-react").default;

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

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function toDataTableRows(rows: AdminAtaRow[]): AdminAtaDataTableRow[] {
  return rows.map((row) => [
    row.indicePersonalizadoGrupo ? `#${row.indicePersonalizadoGrupo}` : "-",
    row.data,
    row.horario,
    row.grupo,
    row.preenchidoPor || "-",
    row.status,
    row,
  ]);
}

function statusLabel(status: AdminAtaStatus) {
  if (status === "Não enviada") return "Não enviada";
  if (status === "Pendente de revisão") return "Pendente de revisão";
  return status;
}

function statusBadgeClass(status: AdminAtaStatus) {
  if (status === "Não enviada") {
    return "responsavel-status-badge admin-status-badge-missing";
  }
  if (status === "Pendente de revisão") {
    return "responsavel-status-badge admin-status-badge-review";
  }
  return "responsavel-status-badge admin-status-badge-sent";
}

function statusBadgeHtml(status: AdminAtaStatus) {
  return `<span class="${statusBadgeClass(status)}">${statusLabel(status)}</span>`;
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
  { title: "Horário", className: "responsavel-centered-column" },
  { title: "Grupo", className: "responsavel-centered-column" },
  { title: "Preenchido por", className: "responsavel-centered-column" },
  {
    title: "Status",
    className: "responsavel-centered-column",
    orderable: false,
    render: (data: AdminAtaStatus, type: string) =>
      type === "display" ? statusBadgeHtml(data) : statusLabel(data),
  },
  {
    title: "Ações",
    className: "responsavel-centered-column",
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
  const [status, setStatus] = useState<"todos" | AdminAtaStatus>("todos");

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

  const tableRows = useMemo(() => toDataTableRows(filteredRows), [filteredRows]);

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
              lengthMenu: "Mostrar _MENU_ registros",
              loadingRecords: "Carregando...",
              paginate: {
                first: "Primeira",
                last: "Última",
                next: "Próxima",
                previous: "Anterior",
              },
              search: "Buscar:",
              searchPlaceholder: "Buscar na tabela...",
              zeroRecords: "Nenhum registro encontrado.",
            },
          }}
          slots={{
            6: (_data: AdminAtaRow, row: AdminAtaDataTableRow) => {
              const ata = row[6];
              const dateLabel = formatDate(ata.data);

              return (
                <div
                  className="row-actions responsavel-ata-actions"
                  aria-label={`Ações da ata de ${dateLabel}`}
                >
                  {ata.ataId ? (
                    <Link
                      className="icon-button"
                      href={`/atas/${ata.ataId}`}
                      aria-label={`Visualizar ata de ${dateLabel} às ${ata.horario}`}
                      title="Visualizar"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Visualizar ata indisponível"
                      title="Ata ainda não enviada"
                      disabled
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Gerar PDF da ata indisponível"
                    title="Gerar PDF será implementado em ciclo próprio"
                    disabled
                  >
                    <FontAwesomeIcon icon={faFilePdf} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Editar ata indisponível"
                    title="Editar ata será implementado em ciclo próprio"
                    disabled
                  >
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                  <button
                    type="button"
                    className="danger-icon-button"
                    aria-label="Excluir ata indisponível"
                    title="Excluir ata será implementado em ciclo próprio"
                    disabled
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </button>
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
