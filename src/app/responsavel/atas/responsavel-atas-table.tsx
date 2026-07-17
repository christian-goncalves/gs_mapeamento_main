"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faPenToSquare,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import type { ConfigColumns } from "datatables.net";

DataTable["use"](DT);

type ResponsavelAtaTab = "enviadas" | "por-servidor" | "todas";

export type ResponsavelAtaRow = {
  ataId: string;
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

type ResponsavelAtaDataTableRow = [
  string,
  string,
  string,
  ResponsavelAtaRow["status"],
  ResponsavelAtaRow,
];

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}-${month}-${year}`;
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
    row.data,
    row.horario,
    row.servidor || "Sem servidor",
    row.status,
    row,
  ]);
}

const columns: ConfigColumns[] = [
  { title: "Data", className: "responsavel-data-column" },
  { title: "Horário", className: "responsavel-centered-column" },
  { title: "Servidor", className: "responsavel-centered-column" },
  { title: "Status", className: "responsavel-centered-column", orderable: false },
  {
    title: "Ações",
    className: "responsavel-centered-column",
    orderable: false,
    searchable: false,
  },
];

export function ResponsavelAtasTable({ rows }: { rows: ResponsavelAtaRow[] }) {
  const [activeTab, setActiveTab] = useState<ResponsavelAtaTab>("enviadas");
  const tabs = ["enviadas", "por-servidor", "todas"] as const;

  const tableRows = useMemo(
    () => toDataTableRows(sortRows(rows, activeTab)),
    [activeTab, rows],
  );

  function updateTab(tab: ResponsavelAtaTab) {
    setActiveTab(tab);
  }

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

      <div className="responsavel-table-wrap">
        <DataTable
          key={activeTab}
          className="responsavel-atas-table"
          columns={columns}
          data={tableRows}
          options={{
            autoWidth: false,
            ordering: true,
            order: activeTab === "por-servidor" ? [[2, "asc"], [0, "desc"]] : [[0, "desc"]],
            orderFixed: { post: [[1, "asc"]] },
            pageLength: 10,
            lengthMenu: [10, 25, 50],
            language: {
              decimal: ",",
              emptyTable: "Nenhuma ata encontrada.",
              info: "_START_ - _END_ de _TOTAL_",
              infoEmpty: "0 - 0 de 0",
              infoFiltered: "(filtrado de _MAX_ atas)",
              lengthMenu: "Mostrar _MENU_ atas",
              loadingRecords: "Carregando...",
              paginate: {
                first: "Primeira",
                last: "Última",
                next: "Próxima",
                previous: "Anterior",
              },
              search: "Buscar:",
              searchPlaceholder: "Buscar atas, datas ou servidores...",
              zeroRecords: "Nenhuma ata encontrada.",
            },
          }}
          slots={{
            0: (data: string, type: string, _row: ResponsavelAtaDataTableRow) => {
              void _row;
              const formattedDate = formatDate(data);
              if (type === "display") return formattedDate;
              if (type === "filter") return `${formattedDate} ${data}`;
              return data;
            },
            3: (
              data: ResponsavelAtaRow["status"],
              type: string,
              _row: ResponsavelAtaDataTableRow,
            ) => {
              void _row;
              return type === "display" ? (
                <span className="responsavel-status-badge">{data}</span>
              ) : (
                data
              );
            },
            4: (_data: ResponsavelAtaRow, type: string, row: ResponsavelAtaDataTableRow) => {
              const ata = row[4];
              const dateLabel = formatDate(ata.data);

              if (type !== "display") return `${dateLabel} ${ata.horario} ${ata.servidor}`;

              return (
                <div
                  className="row-actions responsavel-ata-actions"
                  aria-label={`Ações da ata de ${dateLabel}`}
                >
                  <Link
                    className="icon-button"
                    href={`/atas/${ata.ataId}`}
                    aria-label={`Visualizar ata de ${dateLabel} às ${ata.horario}`}
                    title="Visualizar"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </Link>
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
              <th>Data</th>
              <th>Horário</th>
              <th>Servidor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
        </DataTable>
      </div>
    </section>
  );
}
