"use client";

import { useEffect, useState } from "react";
import type { GrupoHorario, GrupoPlataforma } from "@/domain/entities";
import { plataformaMapping } from "@/domain/enums";
import { associateGrupoHorariosAction, deactivateGrupoPlataformaAction, saveGrupoPlataformaAction } from "./actions";
import { PasswordVisibilityInput } from "../password-visibility-input";

type Assignment = { horario_id: string; plataforma_id: string };
type PlatformDraft = Pick<GrupoPlataforma, "tipo" | "link" | "id_acesso" | "senha_pin"> & { plataforma_id?: string };

const dayLabels: Record<string, string> = { domingo: "Domingo", segunda: "Segunda-feira", terca: "Terça-feira", quarta: "Quarta-feira", quinta: "Quinta-feira", sexta: "Sexta-feira", sabado: "Sábado" };

export function GroupPlatformsEditor({
  grupoId,
  platforms,
  schedules,
  isAdmin,
  isGroupActive = true,
  returnToNewGroupPage = false,
  embedded = false,
}: {
  grupoId: string;
  platforms: GrupoPlataforma[];
  schedules: GrupoHorario[];
  isAdmin: boolean;
  isGroupActive?: boolean;
  returnToNewGroupPage?: boolean;
  embedded?: boolean;
}) {
  const activePlatforms = platforms.filter((platform) => platform.ativo);
  const pendingSchedules = schedules.filter((schedule) => schedule.ativo && !schedule.plataforma_id);
  const label = (code: string) => plataformaMapping.labels[plataformaMapping.codes.indexOf(code as never)] ?? code;
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [step, setStep] = useState(0);
  const [distributionStarted, setDistributionStarted] = useState(false);
  const [platformDraft, setPlatformDraft] = useState<PlatformDraft | null>(null);
  const distributorPlatforms = activePlatforms;
  const currentPlatform = distributorPlatforms[Math.min(step, Math.max(0, distributorPlatforms.length - 1))];
  const showReview = distributorPlatforms.length > 1 && step >= distributorPlatforms.length;
  const allocatedEarlier = new Set(assignments.filter((item) => item.plataforma_id !== currentPlatform?.plataforma_id).map((item) => item.horario_id));
  const remaining = pendingSchedules.filter((schedule) => !allocatedEarlier.has(schedule.horario_id));
  const reviewAssignments = distributorPlatforms.length < 2 || step < distributorPlatforms.length - 1
    ? assignments
    : [...assignments, ...remaining.map((schedule) => ({ horario_id: schedule.horario_id, plataforma_id: distributorPlatforms.at(-1)!.plataforma_id }))];

  useEffect(() => {
    if (!platformDraft) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPlatformDraft(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [platformDraft]);

  function openPlatformForm(tipo: GrupoPlataforma["tipo"], existing?: GrupoPlataforma) {
    setPlatformDraft({
      tipo,
      plataforma_id: existing?.plataforma_id,
      link: existing?.link ?? "",
      id_acesso: existing?.id_acesso ?? "",
      senha_pin: existing?.senha_pin ?? "",
    });
  }

  function toggle(scheduleId: string) {
    setAssignments((current) => current.some((item) => item.horario_id === scheduleId)
      ? current.filter((item) => item.horario_id !== scheduleId)
      : [...current, { horario_id: scheduleId, plataforma_id: currentPlatform!.plataforma_id }]);
  }

  function startDistribution() {
    setAssignments([]);
    setStep(0);
    setDistributionStarted(true);
  }

  function advance() {
    setStep((value) => value + 1);
  }

  if (!isGroupActive) {
    return (
      <section className={`group-platforms-editor${embedded ? " group-platforms-editor-embedded" : " card"}`} aria-label="Plataformas">
        {!embedded && <h2 id="group-platforms-title">Plataformas</h2>}
        <p className="platforms-locked-message" role="status">Ative o grupo para cadastrar as plataformas.</p>
      </section>
    );
  }

  return (
    <section className={`group-platforms-editor${embedded ? " group-platforms-editor-embedded" : " card"}`} aria-label="Plataformas">
      {!embedded && (
        <div className="group-platforms-heading">
          <div>
            <h2 id="group-platforms-title">Plataformas</h2>
            <p className="muted">Cadastre até uma configuração de cada tipo. Os horários serão liberados depois do primeiro cadastro.</p>
          </div>
        </div>
      )}

      <div className="platform-options-grid">
        {plataformaMapping.codes.map((tipo) => {
          const active = activePlatforms.find((platform) => platform.tipo === tipo);
          return (
            <article className="platform-option-card" key={tipo}>
              <div className="platform-option-card-copy">
                <h3>
                  {label(tipo)}
                  <span
                    className={`platform-color-dot platform-color-dot--${tipo}`}
                    aria-hidden="true"
                  />
                </h3>
                <p className={active ? "platform-status platform-status-active" : "platform-status"}>
                  {active ? "Cadastrada" : "Ainda não cadastrada"}
                </p>
              </div>
              <button
                type="button"
                className={active ? "secondary" : undefined}
                disabled={!isGroupActive}
                onClick={() => openPlatformForm(tipo, active)}
              >
                {active ? "Editar Dados" : "Cadastrar"}
              </button>
              {active && schedules.some((schedule) => schedule.ativo && schedule.plataforma_id === active.plataforma_id) ? (
                <details className="platform-deactivation-details">
                  <summary>Desativar Plataforma</summary>
                  <form action={deactivateGrupoPlataformaAction} className="group-platform-deactivate">
                    <input type="hidden" name="grupo_id" value={grupoId} />
                    <input type="hidden" name="settings_section" value="platforms" />
                    <input type="hidden" name="plataforma_id" value={active.plataforma_id} />
                    {returnToNewGroupPage ? <input type="hidden" name="return_to_new_group_page" value="on" /> : null}
                    <label>Transferir Horários para
                      <select name="transfer_to" required defaultValue="">
                        <option value="">Selecione uma plataforma</option>
                        {activePlatforms.filter((candidate) => candidate.plataforma_id !== active.plataforma_id).map((candidate) => <option key={candidate.plataforma_id} value={candidate.plataforma_id}>{label(candidate.tipo)}</option>)}
                      </select>
                    </label>
                    <button type="submit" disabled={activePlatforms.length < 2}>Transferir Horários e desativar</button>
                  </form>
                </details>
              ) : null}
            </article>
          );
        })}
      </div>

      {platformDraft ? (
        <div className="modal-backdrop platform-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPlatformDraft(null);
        }}>
          <section className="confirmation-modal platform-modal" role="dialog" aria-modal="true" aria-labelledby="platform-modal-title">
            <div className="platform-modal-header">
              <div>
                <h2 id="platform-modal-title">{platformDraft.plataforma_id ? "Editar plataforma" : "Cadastrar plataforma"}</h2>
                <p>{label(platformDraft.tipo)}</p>
              </div>
              <button type="button" className="secondary" aria-label="Fechar cadastro da plataforma" onClick={() => setPlatformDraft(null)}>Fechar</button>
            </div>
            <form action={saveGrupoPlataformaAction} className="platform-modal-form">
              <input type="hidden" name="grupo_id" value={grupoId} />
              <input type="hidden" name="settings_section" value="platforms" />
              <input type="hidden" name="tipo" value={platformDraft.tipo} />
              {platformDraft.plataforma_id ? <input type="hidden" name="plataforma_id" value={platformDraft.plataforma_id} /> : null}
              {returnToNewGroupPage ? <input type="hidden" name="return_to_new_group_page" value="on" /> : null}
              <label>Link
                <input type="url" name="link" required autoFocus defaultValue={platformDraft.link} placeholder="https://..." />
              </label>
              <label>ID de acesso (opcional)
                <input name="id_acesso" defaultValue={platformDraft.id_acesso} />
              </label>
              <label>Senha/PIN (opcional)
                <PasswordVisibilityInput
                  name="senha_pin"
                  secretLabel="senha/PIN"
                  autoComplete="off"
                  defaultValue={platformDraft.senha_pin}
                />
              </label>
              <div className="platform-modal-actions">
                <button type="button" className="secondary" onClick={() => setPlatformDraft(null)}>Cancelar</button>
                <button type="submit">Salvar plataforma</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {schedules.length > 0 ? (
        <details className="group-platform-schedule-tools" open={pendingSchedules.length > 0}>
          <summary>Associação de Horários</summary>
          <div className="group-platform-schedule-tools-content">
            <h3>Horários Associados</h3>
            {schedules.filter((schedule) => schedule.ativo && schedule.grupo_id === grupoId && schedule.plataforma_id).map((schedule) => (
              <form key={schedule.horario_id} action={associateGrupoHorariosAction} className="group-platform-transfer" onSubmit={(event) => {
                const target = new FormData(event.currentTarget).get("plataforma_id");
                if (target === schedule.plataforma_id || !window.confirm(`Confirma transferir ${dayLabels[schedule.dia_semana]} às ${schedule.hora_inicio} para ${label(activePlatforms.find((platform) => platform.plataforma_id === target)?.tipo ?? "")}?`)) event.preventDefault();
              }}>
                <input type="hidden" name="grupo_id" value={grupoId} />
                <input type="hidden" name="horario_id" value={schedule.horario_id} />
                <input type="hidden" name="settings_section" value="platforms" />
                {returnToNewGroupPage ? <input type="hidden" name="return_to_new_group_page" value="on" /> : null}
                <span>{dayLabels[schedule.dia_semana]} às {schedule.hora_inicio} — {label(platforms.find((platform) => platform.plataforma_id === schedule.plataforma_id)?.tipo ?? "")}</span>
                <label>Transferir para<select name="plataforma_id" required defaultValue={schedule.plataforma_id}>{activePlatforms.map((platform) => <option key={platform.plataforma_id} value={platform.plataforma_id}>{label(platform.tipo)}</option>)}</select></label>
                <button type="submit">Transferir Horário</button>
              </form>
            ))}
            <h3>Horários sem plataforma</h3>
            {pendingSchedules.length ? <ul>{pendingSchedules.map((schedule) => <li key={schedule.horario_id}>{dayLabels[schedule.dia_semana]} às {schedule.hora_inicio}</li>)}</ul> : <p>Nenhum horário pendente.</p>}
            {activePlatforms.length === 1 && pendingSchedules.length > 0 ? (
              <form action={associateGrupoHorariosAction}>
                <input type="hidden" name="grupo_id" value={grupoId} />
                <input type="hidden" name="settings_section" value="platforms" />
                {returnToNewGroupPage ? <input type="hidden" name="return_to_new_group_page" value="on" /> : null}
                <input type="hidden" name="assignments" value={JSON.stringify(pendingSchedules.map((schedule) => ({ horario_id: schedule.horario_id, plataforma_id: activePlatforms[0].plataforma_id })))} />
                <button type="submit">Associar todos à {label(activePlatforms[0].tipo)}</button>
              </form>
            ) : null}
            {activePlatforms.length > 1 && pendingSchedules.length ? <button type="button" onClick={startDistribution}>Distribuir horários pendentes</button> : null}
            {distributionStarted && currentPlatform && activePlatforms.length > 1 ? (
              <div className="group-platform-distribution">
                {!showReview ? <><h3>{step === activePlatforms.length - 1 ? `Horários restantes para ${label(currentPlatform.tipo)}` : `Selecione horários para ${label(currentPlatform.tipo)}`}</h3>
                {step < activePlatforms.length - 1 ? remaining.map((schedule) => <label key={schedule.horario_id} className="checkbox-label"><input type="checkbox" checked={assignments.some((item) => item.horario_id === schedule.horario_id)} onChange={() => toggle(schedule.horario_id)} />{dayLabels[schedule.dia_semana]} às {schedule.hora_inicio}</label>) : <p>{remaining.length} horário(s) restante(s) serão atribuídos automaticamente.</p>}
                <button type="button" onClick={advance}>{step === activePlatforms.length - 1 ? "Revisar distribuição" : `Continuar para ${label(activePlatforms[step + 1]?.tipo ?? "")}`}</button></> : <div><h3>Confirme a distribuição</h3><ul>{reviewAssignments.map((item) => <li key={item.horario_id}>{schedules.find((schedule) => schedule.horario_id === item.horario_id)?.dia_semana} {schedules.find((schedule) => schedule.horario_id === item.horario_id)?.hora_inicio} — {label(activePlatforms.find((platform) => platform.plataforma_id === item.plataforma_id)?.tipo ?? "")}</li>)}</ul><form action={associateGrupoHorariosAction}><input type="hidden" name="grupo_id" value={grupoId} /><input type="hidden" name="settings_section" value="platforms" />{returnToNewGroupPage ? <input type="hidden" name="return_to_new_group_page" value="on" /> : null}<input type="hidden" name="assignments" value={JSON.stringify(reviewAssignments)} /><button type="submit">Confirmar e salvar vínculos</button></form><button type="button" onClick={() => setStep(activePlatforms.length - 1)}>Voltar</button></div>}
              </div>
            ) : null}
          </div>
        </details>
      ) : null}

      {isAdmin ? <p className="muted platform-types-note">Tipos disponíveis: Zoom, WhatsApp e Zello.</p> : null}
    </section>
  );
}
