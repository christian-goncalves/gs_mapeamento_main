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
  { title: "Ata", className: "responsavel-centered-column" },
  { title: "Data", className: "responsavel-data-column" },
  { title: "Horário", className: "responsavel-centered-column" },
  { title: "Preenchido por", className: "responsavel-centered-column" },
  { title: "Status", className: "responsavel-centered-column", orderable: false },
  {
    title: "Ações",
    className: "responsavel-centered-column",
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
              1: (data: string) => formatDate(data),
              4: (data: ResponsavelAtaRow["status"]) => (
                <span className="responsavel-status-badge">{data}</span>
              ),
              5: (_data: ResponsavelAtaRow, row: ResponsavelAtaDataTableRow) => {
                const ata = row[5];
                const dateLabel = formatDate(ata.data);

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
