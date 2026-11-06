"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  faCheck,
  faPenToSquare,
  faPlus,
  faSpinner,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useFormStatus } from "react-dom";
import type { GrupoHorario, GrupoPlataforma } from "@/domain/entities";
import { plataformaMapping } from "@/domain/enums";
import { saveHorariosGrupoAction, toggleHorarioAction } from "./actions";

const weekDays = [
  ["domingo", "Domingo"],
  ["segunda", "Segunda-feira"],
  ["terca", "Terça-feira"],
  ["quarta", "Quarta-feira"],
  ["quinta", "Quinta-feira"],
  ["sexta", "Sexta-feira"],
  ["sabado", "Sábado"],
] as const;

const localDiaSemanaOrder = Object.fromEntries(
  weekDays.map(([day], index) => [day, index]),
) as Record<string, number>;

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2).toString().padStart(2, "0");
  const minute = index % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

type ScheduleDraft = {
  clientId: string;
  horario_id?: string;
  dia_semana: string;
  hora_inicio: string;
  hora_termino: string;
  plataforma_id?: string;
};

function blankRow(clientId = "blank-initial"): ScheduleDraft {
  return {
    clientId,
    dia_semana: "",
    hora_inicio: "",
    hora_termino: "",
  };
}

function sortSchedules<T extends { dia_semana: string; hora_inicio: string }>(
  schedules: T[],
) {
  return [...schedules].sort((a, b) => {
    const dayDiff =
      (localDiaSemanaOrder[a.dia_semana] ?? 99) -
      (localDiaSemanaOrder[b.dia_semana] ?? 99);
    return dayDiff || a.hora_inicio.localeCompare(b.hora_inicio);
  });
}

function displayTime(time: string) {
  return time.slice(0, 5);
}

function dayLabel(day: string) {
  return weekDays.find(([value]) => value === day)?.[1] ?? day;
}

function responsiveDayLabel(label: string, compact: boolean) {
  return compact ? label.replace(/-feira$/, "") : label;
}

function scheduleKey(row: Pick<ScheduleDraft, "dia_semana" | "hora_inicio">) {
  return `${row.dia_semana}:${row.hora_inicio}`;
}

export function canReviewSchedules(
  completeRowCount: number,
  draft: Pick<ScheduleDraft, "dia_semana" | "hora_inicio">,
  hasDuplicates: boolean,
) {
  const hasCompleteDraft = Boolean(draft.dia_semana && draft.hora_inicio);
  return !hasDuplicates && (completeRowCount > 0 || hasCompleteDraft);
}

function newClientId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ScheduleReviewActions({
  onBack,
  onCancel,
}: {
  onBack: () => void;
  onCancel: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="modal-actions schedule-review-actions">
      <button
        type="button"
        className="secondary"
        disabled={pending}
        onClick={onBack}
      >
        <span className="button-content">
          <FontAwesomeIcon icon={faPenToSquare} />
          Voltar para Corrigir
        </span>
      </button>
      <button
        type="button"
        className="secondary"
        disabled={pending}
        onClick={onCancel}
      >
        <span className="button-content">
          <FontAwesomeIcon icon={faXmark} />
          Cancelar
        </span>
      </button>
      <button type="submit" disabled={pending} aria-live="polite">
        <span className="button-content">
          <FontAwesomeIcon icon={pending ? faSpinner : faCheck} spin={pending} />
          {pending ? "Salvando horários…" : "Confirmar"}
        </span>
      </button>
    </div>
  );
}

function ScheduleDeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="danger-button" disabled={pending}>
      <span className="button-content">
        <FontAwesomeIcon icon={pending ? faSpinner : faTrashCan} spin={pending} />
        {pending ? "Excluindo…" : "Excluir horário"}
      </span>
    </button>
  );
}

export function GroupSchedulesEditor({
  grupoId,
  horarios,
  plataformas = [],
  returnToNewGroupPage = false,
  groupDayRows = false,
}: {
  grupoId: string;
  horarios: GrupoHorario[];
  plataformas?: GrupoPlataforma[];
  returnToNewGroupPage?: boolean;
  groupDayRows?: boolean;
}) {
  const activePlatforms = plataformas.filter(
    (item) => item.ativo && item.grupo_id === grupoId,
  );
  function platformForSchedule(row: Pick<ScheduleDraft, "plataforma_id">) {
    return activePlatforms.find(
      (platform) => platform.plataforma_id === row.plataforma_id,
    ) ?? (activePlatforms.length === 1 ? activePlatforms[0] : undefined);
  }
  function platformLabelForSchedule(row: Pick<ScheduleDraft, "plataforma_id">) {
    const platform = platformForSchedule(row);
    return platform ? plataformaMapping.toSheet(platform.tipo) : "Plataforma não definida";
  }
  function platformDot(row: Pick<ScheduleDraft, "plataforma_id">) {
    const platform = platformForSchedule(row);
    if (!platform) return null;
    const label = plataformaMapping.toSheet(platform.tipo);
    return (
      <span
        className={`platform-color-dot platform-color-dot--${platform.tipo}`}
        role="img"
        aria-label={label}
        title={label}
      />
    );
  }
  const activeRows = useMemo(
    () =>
      sortSchedules(
        horarios
          .filter((horario) => horario.ativo)
          .map((horario) => ({
            clientId: horario.horario_id,
            horario_id: horario.horario_id,
            dia_semana: horario.dia_semana,
            hora_inicio: horario.hora_inicio,
            hora_termino: horario.hora_termino ?? "",
            plataforma_id: horario.plataforma_id,
          })),
      ),
    [horarios],
  );
  const initialRows = useMemo(() => activeRows, [activeRows]);
  const [rows, setRows] = useState<ScheduleDraft[]>(initialRows);
  const [compactDayLabels, setCompactDayLabels] = useState(false);
  const [editing, setEditing] = useState(activeRows.length === 0);
  const [reviewing, setReviewing] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [rowBeforeEdit, setRowBeforeEdit] = useState<ScheduleDraft | null>(null);
  const [deletingRow, setDeletingRow] = useState<ScheduleDraft | null>(null);
  const [adding, setAdding] = useState(activeRows.length === 0);
  const [addDraft, setAddDraft] = useState<ScheduleDraft>(blankRow("new"));
  const [addError, setAddError] = useState("");
  const scheduleEndRef = useRef<HTMLDivElement | null>(null);
  const editingRow = rows.find((row) => row.clientId === editingRowId) ?? null;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const updateCompactDayLabels = () => setCompactDayLabels(media.matches);
    updateCompactDayLabels();
    media.addEventListener("change", updateCompactDayLabels);
    return () => media.removeEventListener("change", updateCompactDayLabels);
  }, []);

  function scrollToScheduleEnd() {
    window.requestAnimationFrame(() => {
      scheduleEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }

  useEffect(() => {
    if (adding) scrollToScheduleEnd();
  }, [adding]);

  const completeRows = sortSchedules(
    rows
      .filter((row) => row.dia_semana && row.hora_inicio)
      .map(({ horario_id, dia_semana, hora_inicio, hora_termino, plataforma_id }) => ({ horario_id, dia_semana, hora_inicio, hora_termino, plataforma_id })),
  );
  const duplicateKeys = new Set<string>();
  const seenKeys = new Set<string>();
  for (const row of completeRows) {
    const key = `${row.dia_semana}:${row.hora_inicio}`;
    if (seenKeys.has(key)) duplicateKeys.add(key);
    seenKeys.add(key);
  }
  const hasDuplicates = duplicateKeys.size > 0;

  function updateRow(
    clientId: string,
    field: "dia_semana" | "hora_inicio" | "hora_termino",
    value: string,
  ) {
    setRows((current) =>
      current.map((row) =>
        row.clientId === clientId ? { ...row, [field]: value } : row,
      ),
    );
  }

  function review() {
    if (hasDuplicates) {
      setAddError("Existem horários duplicados. Revise dia e hora antes de continuar.");
      return;
    }

    const hasPartialAddDraft = Boolean(addDraft.dia_semana || addDraft.hora_inicio || addDraft.hora_termino);
    const hasCompleteAddDraft = Boolean(addDraft.dia_semana && addDraft.hora_inicio);

    if (hasPartialAddDraft && !hasCompleteAddDraft) {
      setAddError("Complete o dia e a hora de início antes de confirmar.");
      return;
    }

    if (hasCompleteAddDraft) {
      if (rows.some((row) => scheduleKey(row) === scheduleKey(addDraft))) {
        setAddError("Este horário já está cadastrado para este dia.");
        return;
      }
      if (activePlatforms.length > 1 && !addDraft.plataforma_id) {
        setAddError("Selecione e confirme uma plataforma para este horário.");
        return;
      }

      setRows((current) =>
        sortSchedules([
          ...current,
          { ...addDraft, clientId: newClientId() },
        ]),
      );
      setAddDraft(blankRow("new"));
      setAdding(false);
      setAddError("");
      setReviewing(true);
      return;
    }

    if (completeRows.length > 0 && !hasDuplicates) setReviewing(true);
  }

  function cancelEditing() {
    setRows(initialRows);
    setReviewing(false);
    setEditing(false);
    setEditingRowId(null);
    setRowBeforeEdit(null);
    setAdding(false);
    setAddDraft(blankRow("new"));
    setAddError("");
  }

  function startRowEdit(row: ScheduleDraft) {
    setEditingRowId(row.clientId);
    setRowBeforeEdit(row);
  }

  function cancelRowEdit() {
    if (rowBeforeEdit) {
      setRows((current) =>
        current.map((row) =>
          row.clientId === rowBeforeEdit.clientId ? rowBeforeEdit : row,
        ),
      );
    }
    setEditingRowId(null);
    setRowBeforeEdit(null);
  }

  function finishRowEdit() {
    setRows((current) => sortSchedules(current));
    setEditingRowId(null);
    setRowBeforeEdit(null);
  }

  function deleteRow(row: ScheduleDraft) {
    setRows((current) =>
      current.filter((item) => item.clientId !== row.clientId),
    );
    if (editingRowId === row.clientId) {
      setEditingRowId(null);
      setRowBeforeEdit(null);
    }
    setDeletingRow(null);
  }

  function closeDeleteConfirmation() {
    setDeletingRow(null);
  }

  function updateAddDraft(
    field: "dia_semana" | "hora_inicio" | "hora_termino",
    value: string,
  ) {
    setAddDraft((current) => ({ ...current, [field]: value }));
    setAddError("");
  }

  function addSchedule() {
    if (!addDraft.dia_semana || !addDraft.hora_inicio) {
      setAddError("Informe dia e hora de início antes de adicionar.");
      return;
    }
    if (rows.some((row) => scheduleKey(row) === scheduleKey(addDraft))) {
      setAddError("Este horário já está cadastrado para este dia.");
      return;
    }
    if (plataformas.filter((item) => item.ativo && item.grupo_id === grupoId).length > 1 && !addDraft.plataforma_id) {
      setAddError("Selecione e confirme uma plataforma para este horário.");
      return;
    }
    setRows((current) =>
      sortSchedules([
        ...current,
        { ...addDraft, clientId: newClientId() },
      ]),
    );
    setAddDraft(blankRow("new"));
    setAdding(false);
    setAddError("");
    scrollToScheduleEnd();
  }

  const selectedAddPlatformId =
    addDraft.plataforma_id ?? (activePlatforms.length === 1 ? activePlatforms[0]?.plataforma_id ?? "" : "");

  if (!editing) {
    return (
      <div className="schedule-editor">
        <div className="table-wrap">
          <table className="schedule-summary-table">
            <thead>
              <tr>
                <th>Dia</th>
                <th>Hora de Início*</th>
              </tr>
            </thead>
            <tbody>
              {weekDays.map(([day, label]) => {
                const dayRows = activeRows.filter(
                  (row) => row.dia_semana === day,
                );
                return (
                  <tr key={day}>
                    <th scope="row">{responsiveDayLabel(label, compactDayLabels)}</th>
                    <td>
                      {dayRows.length > 0 ? (
                        <span className="schedule-summary-times">
                          {dayRows.map((row, rowIndex) => (
                            <span className="schedule-summary-time" key={row.clientId}>
                              {displayTime(row.hora_inicio)}
                              {platformDot(row)}
                              {rowIndex < dayRows.length - 1 ? (
                                <span className="schedule-summary-separator" aria-hidden="true"> | </span>
                              ) : null}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="schedule-time-note">* Horário de Brasília (BRT)</p>
        <div className="section-footer schedule-view-footer">
          <button
            className="group-wide-action"
            type="button"
            onClick={() => setEditing(true)}
          >
            <span className="button-content">
              <FontAwesomeIcon icon={faPenToSquare} />
              Editar Horários
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-editor">
      <div className="table-wrap">
        <table className={`schedule-management-table${groupDayRows ? " schedule-day-grouped" : ""}`}>
          <thead>
            <tr>
              <th>Dia</th>
              <th>Hora de Início</th>
              <th>Hora de Término</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <span className="muted">Nenhum horário cadastrado.</span>
                </td>
              </tr>
            )}
            {rows.map((row, index) => {
              const showDay =
                index === 0 || rows[index - 1]?.dia_semana !== row.dia_semana;
              const continuesSameDay =
                rows[index + 1]?.dia_semana === row.dia_semana;
              return (
                <tr
                  className={[
                    showDay ? "" : "schedule-same-day-row",
                    continuesSameDay ? "schedule-continued-day-row" : "",
                  ].filter(Boolean).join(" ") || undefined}
                  key={row.clientId}
                >
                  {(!groupDayRows || showDay) && (
                    <td className="schedule-day-cell" rowSpan={groupDayRows ? rows.filter((item) => item.dia_semana === row.dia_semana).length : 1}>
                      {showDay ? responsiveDayLabel(dayLabel(row.dia_semana), compactDayLabels) : ""}
                    </td>
                  )}
                  <td>
                    <span className="schedule-time-platform">
                      {displayTime(row.hora_inicio)}
                      {platformDot(row)}
                    </span>
                  </td>
                  <td>
                    {row.hora_termino ? displayTime(row.hora_termino) : <span className="muted">-</span>}
                  </td>
                  <td>
                    <div className="row-actions schedule-actions">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Editar ${dayLabel(row.dia_semana)} ${displayTime(row.hora_inicio)}`}
                        title="Editar"
                        onClick={() => startRowEdit(row)}
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      {row.horario_id ? (
                        <button
                          type="button"
                          className="danger-icon-button"
                          aria-label={`Excluir ${dayLabel(row.dia_semana)} ${displayTime(row.hora_inicio)}`}
                          title="Excluir"
                          onClick={() => setDeletingRow(row)}
                        >
                          <FontAwesomeIcon icon={faTrashCan} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="danger-icon-button"
                          aria-label={`Excluir ${dayLabel(row.dia_semana)} ${displayTime(row.hora_inicio)}`}
                          title="Excluir horário não salvo"
                          onClick={() => setDeletingRow(row)}
                        >
                          <FontAwesomeIcon icon={faTrashCan} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingRow ? (
        <div
          className="modal-backdrop schedule-row-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelRowEdit();
          }}
        >
          <section
            className="confirmation-modal schedule-row-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-row-modal-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") cancelRowEdit();
            }}
          >
            <header className="schedule-row-modal-header">
              <h2 id="schedule-row-modal-title">Editar Horário</h2>
              <button
                type="button"
                className="icon-button"
                aria-label="Fechar edição do horário"
                onClick={cancelRowEdit}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </header>
            <div className="schedule-row-modal-fields">
              <label>
                Dia
                <select
                  autoFocus
                  value={editingRow.dia_semana}
                  onChange={(event) => updateRow(editingRow.clientId, "dia_semana", event.target.value)}
                >
                  {weekDays.map(([value, label]) => (
                    <option key={value} value={value}>{responsiveDayLabel(label, compactDayLabels)}</option>
                  ))}
                </select>
              </label>
              <label>
                Hora de Início
                <select
                  value={editingRow.hora_inicio}
                  onChange={(event) => updateRow(editingRow.clientId, "hora_inicio", event.target.value)}
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
              <label>
                Hora de Término
                <select
                  value={editingRow.hora_termino}
                  onChange={(event) => updateRow(editingRow.clientId, "hora_termino", event.target.value)}
                >
                  <option value="">Opcional</option>
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="schedule-row-modal-actions">
              <button type="button" onClick={finishRowEdit}>
                <span className="button-content">
                  <FontAwesomeIcon icon={faCheck} />
                  Confirmar
                </span>
              </button>
              <button type="button" className="secondary" onClick={cancelRowEdit}>
                <span className="button-content">
                  <FontAwesomeIcon icon={faXmark} />
                  Cancelar
                </span>
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {deletingRow ? createPortal(
        <div
          className="modal-backdrop schedule-delete-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDeleteConfirmation();
          }}
        >
          <section
            className="confirmation-modal schedule-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-delete-title"
            onKeyDown={(event) => {
              if (event.key === "Escape") closeDeleteConfirmation();
            }}
          >
            <h2 id="schedule-delete-title">Excluir horário?</h2>
            <p>
              Confirma excluir {responsiveDayLabel(dayLabel(deletingRow.dia_semana), compactDayLabels)} às {displayTime(deletingRow.hora_inicio)}?
            </p>
            {deletingRow.horario_id ? (
              <form action={toggleHorarioAction}>
                <input type="hidden" name="grupo_id" value={grupoId} />
                <input type="hidden" name="horario_id" value={deletingRow.horario_id} />
                <input type="hidden" name="ativo" value="false" />
                <input type="hidden" name="settings_section" value="schedules" />
                {returnToNewGroupPage ? (
                  <input type="hidden" name="return_to_new_group_page" value="on" />
                ) : null}
                <div className="modal-actions">
                  <button autoFocus type="button" className="secondary" onClick={closeDeleteConfirmation}>
                    <span className="button-content">
                      <FontAwesomeIcon icon={faXmark} />
                      Cancelar
                    </span>
                  </button>
                  <ScheduleDeleteSubmitButton />
                </div>
              </form>
            ) : (
              <div className="modal-actions">
                <button autoFocus type="button" className="secondary" onClick={closeDeleteConfirmation}>
                  <span className="button-content">
                    <FontAwesomeIcon icon={faXmark} />
                    Cancelar
                  </span>
                </button>
                <button type="button" className="danger-button" onClick={() => deleteRow(deletingRow)}>
                  <span className="button-content">
                    <FontAwesomeIcon icon={faTrashCan} />
                    Excluir horário
                  </span>
                </button>
              </div>
            )}
          </section>
        </div>,
        document.body,
      ) : null}

      {hasDuplicates && (
        <p className="form-error">
          Existem horários duplicados. Revise dia e hora antes de continuar.
        </p>
      )}

      {addError && <p className="form-error">{addError}</p>}

      {adding ? (
        <div className="schedule-add-row">
          <label>
            Dia
            <select
              value={addDraft.dia_semana}
              onChange={(event) => updateAddDraft("dia_semana", event.target.value)}
            >
              <option value="">Selecione</option>
              {weekDays.map(([value, label]) => (
                <option key={value} value={value}>{responsiveDayLabel(label, compactDayLabels)}</option>
              ))}
            </select>
          </label>
          <label>
            Hora de Início
            <select
              value={addDraft.hora_inicio}
              onChange={(event) => updateAddDraft("hora_inicio", event.target.value)}
            >
              <option value="">Selecione</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </label>
          <label>
            Hora de Término
            <select
              value={addDraft.hora_termino}
              onChange={(event) => updateAddDraft("hora_termino", event.target.value)}
            >
              <option value="">Opcional</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </label>
          <label>
            Plataforma
            <select
              value={selectedAddPlatformId}
              disabled={activePlatforms.length === 1}
              onChange={(event) => setAddDraft((current) => ({ ...current, plataforma_id: event.target.value }))}
            >
              <option value="">Selecione e confirme</option>
              {activePlatforms.map((item) => (
                <option key={item.plataforma_id} value={item.plataforma_id}>
                  {plataformaMapping.toSheet(item.tipo)}
                </option>
              ))}
            </select>
          </label>
          <div className="row-actions">
            <button type="button" onClick={addSchedule}>
              <span className="button-content">
                <FontAwesomeIcon icon={faPlus} />
                Adicionar
              </span>
            </button>
            {rows.length > 0 && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setAdding(false);
                  setAddDraft(blankRow("new"));
                  setAddError("");
                }}
              >
                <span className="button-content">
                  <FontAwesomeIcon icon={faXmark} />
                  Cancelar
                </span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="section-footer">
          <button type="button" onClick={() => setAdding(true)}>
            <span className="button-content">
              <FontAwesomeIcon icon={faPlus} />
              Adicionar Horário
            </span>
          </button>
        </div>
      )}

      <div className="section-footer">
        <button
          type="button"
          disabled={!canReviewSchedules(completeRows.length, addDraft, hasDuplicates)}
          onClick={review}
        >
          <span className="button-content">
            <FontAwesomeIcon icon={faCheck} />
            Confirmar
          </span>
        </button>
        {activeRows.length > 0 && (
          <button type="button" className="secondary" onClick={cancelEditing}>
            <span className="button-content">
              <FontAwesomeIcon icon={faXmark} />
              Cancelar Edição
            </span>
          </button>
        )}
      </div>
      <div ref={scheduleEndRef} />

      {reviewing && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="confirmation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-review-title"
          >
            <h2 id="schedule-review-title">Confirmar Horários</h2>
            <div className="schedule-review-list">
              {weekDays.map(([day, label]) => {
                const dayRows = completeRows.filter(
                  (row) => row.dia_semana === day,
                );
                if (dayRows.length === 0) return null;
                return (
                  <section key={day}>
                    <h3>{responsiveDayLabel(label, compactDayLabels)}</h3>
                    <ul>
                      {dayRows.map((row) => (
                        <li key={`${row.dia_semana}:${row.hora_inicio}`}>
                          {displayTime(row.hora_inicio)} | {platformLabelForSchedule(row)}
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
            <form action={saveHorariosGrupoAction}>
              <input type="hidden" name="grupo_id" value={grupoId} />
              <input type="hidden" name="settings_section" value="schedules" />
              {returnToNewGroupPage ? (
                <input type="hidden" name="return_to_new_group_page" value="on" />
              ) : null}
              <input
                type="hidden"
                name="horarios"
                value={JSON.stringify(completeRows)}
              />
              <ScheduleReviewActions
                onBack={() => setReviewing(false)}
                onCancel={() => setReviewing(false)}
              />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
