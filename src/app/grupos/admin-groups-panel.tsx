"use client";

import { useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faMagnifyingGlass,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { GroupListActions } from "./group-list-actions";

type StatusFilter = "ativos" | "inativos" | "todos";

type AdminGroup = {
  grupo_id: string;
  grupo_nome: string;
  ativo: boolean;
  created_at: string;
  email_acesso_grupo: string;
  responsavel_grupo_nome: string;
  responsavel_grupo_email: string;
  activeSchedules: number;
};

const statusLabels: Record<StatusFilter, string> = {
  ativos: "Ativos",
  inativos: "Inativos",
  todos: "Todos",
};

const feedbackMessages: Record<string, string> = {
  activated: "Grupo ativado.",
  deactivated: "Grupo inativado.",
  "already-active": "O grupo já estava ativo.",
  "already-inactive": "O grupo já estava inativo.",
  error: "Nao foi possivel concluir a acao. Tente novamente.",
};

function normalizeSearch(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function filterByStatus(group: AdminGroup, status: StatusFilter) {
  if (status === "ativos") return group.ativo;
  if (status === "inativos") return !group.ativo;
  return true;
}

function formatCreatedAt(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() <= 1970) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function AdminGroupsPanel({
  groups,
  status,
}: {
  groups: AdminGroup[];
  status?: string;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ativos");
  const [search, setSearch] = useState("");
  const tabRefs = useRef<Record<StatusFilter, HTMLButtonElement | null>>({
    ativos: null,
    inativos: null,
    todos: null,
  });
  const normalizedSearch = normalizeSearch(search);
  const statuses = ["ativos", "inativos", "todos"] as const;
  const feedbackMessage = status ? feedbackMessages[status] : undefined;

  const counts = useMemo(() => {
    const active = groups.filter((group) => group.ativo).length;
    return {
      active,
      inactive: groups.length - active,
      total: groups.length,
    };
  }, [groups]);

  const filteredGroups = useMemo(
    () =>
      groups.filter((group) => {
        if (!filterByStatus(group, statusFilter)) return false;
        if (!normalizedSearch) return true;
        return normalizeSearch(group.grupo_nome).includes(normalizedSearch);
      }),
    [groups, normalizedSearch, statusFilter],
  );

  const emptyMessage =
    groups.length === 0
      ? "Nenhum grupo cadastrado."
      : normalizedSearch
        ? `Nenhum grupo encontrado para "${search.trim()}".`
        : `Nenhum grupo em ${statusLabels[statusFilter].toLocaleLowerCase("pt-BR")}.`;

  function selectRelativeTab(direction: 1 | -1) {
    const currentIndex = statuses.indexOf(statusFilter);
    const nextIndex = (currentIndex + direction + statuses.length) % statuses.length;
    const nextStatus = statuses[nextIndex];
    setStatusFilter(nextStatus);
    window.requestAnimationFrame(() => tabRefs.current[nextStatus]?.focus());
  }

  return (
    <div className="admin-groups-panel">
      {feedbackMessage && (
        <p className="admin-status-feedback" role="status">
          {feedbackMessage}
        </p>
      )}

      <section className="summary-cards" aria-label="Resumo dos grupos">
        <dl className="summary-card">
          <span className="summary-icon summary-icon-active" aria-hidden="true">
            <FontAwesomeIcon icon={faUsers} />
          </span>
          <div>
            <dt>Ativos</dt>
            <dd>{counts.active}</dd>
          </div>
        </dl>
        <dl className="summary-card">
          <span className="summary-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faClock} />
          </span>
          <div>
            <dt>Inativos</dt>
            <dd>{counts.inactive}</dd>
          </div>
        </dl>
        <dl className="summary-card">
          <span className="summary-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faUsers} />
          </span>
          <div>
            <dt>Total</dt>
            <dd>{counts.total}</dd>
          </div>
        </dl>
      </section>

      <section className="card admin-groups-card">
        <div className="status-tabs" role="tablist" aria-label="Filtrar grupos por status">
          {statuses.map((status) => (
            <button
              key={status}
              id={`groups-tab-${status}`}
              ref={(element) => {
                tabRefs.current[status] = element;
              }}
              type="button"
              role="tab"
              aria-selected={statusFilter === status}
              aria-controls="groups-panel"
              tabIndex={statusFilter === status ? 0 : -1}
              className={statusFilter === status ? "status-tab status-tab-active" : "status-tab"}
              onClick={() => setStatusFilter(status)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  selectRelativeTab(1);
                }
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  selectRelativeTab(-1);
                }
              }}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>

        <div className="group-search">
          <label htmlFor="group-search-input">Buscar grupos</label>
          <div className="group-search-field">
            <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
            <input
              id="group-search-input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar grupos..."
            />
            {search && (
              <button
                type="button"
                className="search-clear-button"
                aria-label="Limpar busca"
                title="Limpar busca"
                onClick={() => setSearch("")}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>
        </div>

        <div
          id="groups-panel"
          role="tabpanel"
          aria-labelledby={`groups-tab-${statusFilter}`}
          className="admin-group-list-wrap"
        >
          {filteredGroups.length === 0 ? (
            <p className="empty-state" role="status">{emptyMessage}</p>
          ) : (
            <ol className="admin-group-list" aria-label="Grupos administrativos">
              {filteredGroups.map((group) => {
                const createdAt = formatCreatedAt(group.created_at);
                return (
                  <li className="admin-group-item" key={group.grupo_id}>
                    <div className="admin-group-main">
                      <div className="admin-group-title-row">
                        <h2>{group.grupo_nome}</h2>
                        {statusFilter === "todos" && (
                          <span className={group.ativo ? "group-status-badge" : "group-status-badge group-status-badge-muted"}>
                            {group.ativo ? "Ativo" : "Inativo"}
                          </span>
                        )}
                      </div>
                      <p className="admin-group-meta">
                        {createdAt && <span>Criado em {createdAt}</span>}
                        {createdAt && <span aria-hidden="true">•</span>}
                        <span>{group.activeSchedules} horários ativos</span>
                        {group.responsavel_grupo_nome && <span aria-hidden="true">•</span>}
                        {group.responsavel_grupo_nome && <span>{group.responsavel_grupo_nome}</span>}
                      </p>
                    </div>
                    <div className="admin-group-actions">
                      <GroupListActions
                        grupoId={group.grupo_id}
                        grupoNome={group.grupo_nome}
                        ativo={group.ativo}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
