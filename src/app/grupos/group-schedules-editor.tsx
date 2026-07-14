"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  faCheck,
  faCircleCheck,
  faPenToSquare,
  faPlus,
  faTrashCan,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { GrupoHorario } from "@/domain/entities";
import { saveHorariosGrupoAction } from "./actions";

const weekDays = [
  ["domingo", "Domingo"],
  ["segunda", "Segunda"],
  ["terca", "Terça"],
  ["quarta", "Quarta"],
  ["quinta", "Quinta"],
  ["sexta", "Sexta"],
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
  dia_semana: string;
  hora_inicio: string;
};

function blankRow(clientId = "blank-initial"): ScheduleDraft {
  return {
    clientId,
    dia_semana: "",
    hora_inicio: "",
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

function scheduleKey(row: Pick<ScheduleDraft, "dia_semana" | "hora_inicio">) {
  return `${row.dia_semana}:${row.hora_inicio}`;
}

function newClientId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function GroupSchedulesEditor({
  grupoId,
  horarios,
}: {
  grupoId: string;
  horarios: GrupoHorario[];
}) {
  const activeRows = useMemo(
    () =>
      sortSchedules(
        horarios
          .filter((horario) => horario.ativo)
          .map((horario) => ({
            clientId: horario.horario_id,
            dia_semana: horario.dia_semana,
            hora_inicio: horario.hora_inicio,
          })),
      ),
    [horarios],
  );
  const initialRows = useMemo(() => activeRows, [activeRows]);
  const [rows, setRows] = useState<ScheduleDraft[]>(initialRows);
  const [editing, setEditing] = useState(activeRows.length === 0);
  const [reviewing, setReviewing] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [rowBeforeEdit, setRowBeforeEdit] = useState<ScheduleDraft | null>(null);
  const [adding, setAdding] = useState(activeRows.length === 0);
  const [addDraft, setAddDraft] = useState<ScheduleDraft>(blankRow("new"));
  const [addError, setAddError] = useState("");
  const scheduleEndRef = useRef<HTMLDivElement | null>(null);

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
      .map(({ dia_semana, hora_inicio }) => ({ dia_semana, hora_inicio })),
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
    field: "dia_semana" | "hora_inicio",
    value: string,
  ) {
    setRows((current) =>
      current.map((row) =>
        row.clientId === clientId ? { ...row, [field]: value } : row,
      ),
    );
  }

  function review() {
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
    if (!window.confirm(`Excluir ${dayLabel(row.dia_semana)} ${displayTime(row.hora_inicio)}?`)) {
      return;
    }
    setRows((current) =>
      current.filter((item) => item.clientId !== row.clientId),
    );
    if (editingRowId === row.clientId) {
      setEditingRowId(null);
      setRowBeforeEdit(null);
    }
  }

  function updateAddDraft(
    field: "dia_semana" | "hora_inicio",
    value: string,
  ) {
    setAddDraft((current) => ({ ...current, [field]: value }));
    setAddError("");
  }

  function addSchedule() {
    if (!addDraft.dia_semana || !addDraft.hora_inicio) {
      setAddError("Informe dia e horário antes de adicionar.");
      return;
    }
    if (rows.some((row) => scheduleKey(row) === scheduleKey(addDraft))) {
      setAddError("Este horário já está cadastrado para este dia.");
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

  if (!editing) {
    return (
      <div className="schedule-editor">
        <div className="table-wrap">
          <table className="schedule-summary-table">
            <thead>
              <tr>
                <th>Dia</th>
                <th>Horários</th>
              </tr>
            </thead>
            <tbody>
              {weekDays.map(([day, label]) => {
                const dayRows = activeRows.filter(
                  (row) => row.dia_semana === day,
                );
                return (
                  <tr key={day}>
                    <th scope="row">{label}</th>
                    <td>
                      {dayRows.length > 0 ? (
                        <span className="schedule-summary-times">
                          {dayRows.map((row) => displayTime(row.hora_inicio)).join(", ")}
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
        <div className="section-footer schedule-view-footer">
          <button
            className="group-wide-action"
            type="button"
            onClick={() => setEditing(true)}
          >
            <span className="button-content">
              <FontAwesomeIcon icon={faPenToSquare} />
              Editar horários
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-editor">
      <div className="table-wrap">
        <table className="schedule-management-table">
          <thead>
            <tr>
              <th>Dia</th>
              <th>Horário</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <span className="muted">Nenhum horário cadastrado.</span>
                </td>
              </tr>
            )}
            {rows.map((row, index) => {
              const isEditingRow = editingRowId === row.clientId;
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
                  <td>
                    {isEditingRow ? (
                      <select
                        aria-label="Dia"
                        value={row.dia_semana}
                        onChange={(event) =>
                          updateRow(row.clientId, "dia_semana", event.target.value)
                        }
                      >
                        {weekDays.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      showDay ? dayLabel(row.dia_semana) : ""
                    )}
                  </td>
                  <td>
                    {isEditingRow ? (
                      <select
                        aria-label="Horário"
                        value={row.hora_inicio}
                        onChange={(event) =>
                          updateRow(row.clientId, "hora_inicio", event.target.value)
                        }
                      >
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    ) : (
                      displayTime(row.hora_inicio)
                    )}
                  </td>
                  <td>
                    <div className="row-actions schedule-actions">
                      {isEditingRow ? (
                        <>
                          <button type="button" onClick={finishRowEdit}>
                            <span className="button-content">
                              <FontAwesomeIcon icon={faCheck} />
                              CONFIRMAR
                            </span>
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            onClick={cancelRowEdit}
                          >
                            <span className="button-content">
                              <FontAwesomeIcon icon={faXmark} />
                              Cancelar
                            </span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="icon-button"
                            aria-label={`Editar ${dayLabel(row.dia_semana)} ${displayTime(row.hora_inicio)}`}
                            title="Editar"
                            onClick={() => startRowEdit(row)}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} />
                          </button>
                          <button
                            type="button"
                            className="danger-icon-button"
                            aria-label={`Excluir ${dayLabel(row.dia_semana)} ${displayTime(row.hora_inicio)}`}
                            title="Excluir"
                            onClick={() => deleteRow(row)}
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Hora
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
          <button type="button" className="secondary" onClick={() => setAdding(true)}>
            <span className="button-content">
              <FontAwesomeIcon icon={faPlus} />
              Adicionar horário
            </span>
          </button>
        </div>
      )}

      <div className="section-footer">
        <button
          type="button"
          disabled={completeRows.length === 0 || hasDuplicates}
          onClick={review}
        >
          <span className="button-content">
            <FontAwesomeIcon icon={faCircleCheck} />
            CONFIRMAR
          </span>
        </button>
        {activeRows.length > 0 && (
          <button type="button" className="secondary" onClick={cancelEditing}>
            <span className="button-content">
              <FontAwesomeIcon icon={faXmark} />
              Cancelar edição
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
            <h2 id="schedule-review-title">Confirmar horários</h2>
            <div className="schedule-review-list">
              {weekDays.map(([day, label]) => {
                const dayRows = completeRows.filter(
                  (row) => row.dia_semana === day,
                );
                if (dayRows.length === 0) return null;
                return (
                  <section key={day}>
                    <h3>{label}</h3>
                    <ul>
                      {dayRows.map((row) => (
                        <li key={`${row.dia_semana}:${row.hora_inicio}`}>
                          {row.hora_inicio}
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
            <form action={saveHorariosGrupoAction}>
              <input type="hidden" name="grupo_id" value={grupoId} />
              <input
                type="hidden"
                name="horarios"
                value={JSON.stringify(completeRows)}
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setReviewing(false)}
                >
                  <span className="button-content">
                    <FontAwesomeIcon icon={faPenToSquare} />
                    Voltar para corrigir
                  </span>
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setReviewing(false)}
                >
                  <span className="button-content">
                    <FontAwesomeIcon icon={faXmark} />
                    Cancelar
                  </span>
                </button>
                <button type="submit">
                  <span className="button-content">
                    <FontAwesomeIcon icon={faCheck} />
                    CONFIRMAR
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
