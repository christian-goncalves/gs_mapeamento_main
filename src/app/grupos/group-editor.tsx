"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import {
  faArrowLeft,
  faCircleInfo,
  faChevronDown,
  faFloppyDisk,
  faPenToSquare,
  faPlus,
  faRotateRight,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Grupo, GrupoHorario, GrupoPlataforma } from "@/domain/entities";
import { plataformaMapping } from "@/domain/enums";
import {
  KNOWN_MESA_OFFICES,
  isVacantMesaName,
} from "@/domain/grupo-servidores-mesa";
import type { GrupoServidorMesa } from "@/domain/schemas";
import { isSecureAtaLinkToken } from "@/lib/ata-link-token";
import {
  rotateActivationInviteAction,
  rotateAtaLinkAction,
  saveGrupoAction,
  saveGrupoServidoresMesaAction,
} from "./actions";
import { CopyableLink } from "./copyable-link";
import { isSubmitFromAnotherForm } from "./group-editor-submit";
import { GroupSchedulesEditor } from "./group-schedules-editor";
import { GroupPlatformsEditor } from "./group-platforms-editor";
import { MesaServersSummary } from "./mesa-servers-summary";
import { EmailChangeDialog } from "./email-change-dialog";

const emptyGroup: Grupo = {
  grupo_id: "",
  zoom_id: "",
  grupo_nome: "",
  ordem: 1,
  ativo: true,
  revisao_atas_ativa: false,
  responsavel_grupo_nome: "",
  responsavel_grupo_email: "",
  email_acesso_grupo: "",
  responsaveis_ata: "",
  link_formulario_ata: "",
  ultima_reuniao_anterior: 0,
  fuso_horario: "America/Sao_Paulo",
  plataforma: "zoom",
  acesso_plataforma: "",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

function ScheduleTimeHelp() {
  return (
    <span
      className="schedule-time-help-icon"
      role="img"
      tabIndex={0}
      aria-label="Informações sobre o horário da agenda"
      title="Os horários desta agenda são informados no horário de Brasília (UTC−03:00)."
    >
      <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
    </span>
  );
}

function PlatformBadge({ tipo }: { tipo: (typeof plataformaMapping.codes)[number] }) {
  return (
    <li className={`platform-legend-badge platform-legend-badge--${tipo}`}>
      <span className={`platform-color-dot platform-color-dot--${tipo}`} aria-hidden="true" />
      {plataformaMapping.toSheet(tipo)}
    </li>
  );
}

function PlatformLegend() {
  return (
    <ul className="platform-legend" aria-label="Legenda de plataformas">
      {plataformaMapping.codes.map((tipo) => (
        <PlatformBadge tipo={tipo} key={tipo} />
      ))}
    </ul>
  );
}

function GroupPlatformsSummary({ platforms }: { platforms: GrupoPlataforma[] }) {
  const usedTypes = plataformaMapping.codes.filter((tipo) =>
    platforms.some((platform) => platform.ativo && platform.tipo === tipo),
  );
  if (usedTypes.length === 0) return null;

  return (
    <div className="group-platforms-summary">
      <span className="group-platforms-summary-label">Plataformas Utilizadas</span>
      <ul className="platform-legend" aria-label="Plataformas Utilizadas">
        {usedTypes.map((tipo) => <PlatformBadge tipo={tipo} key={tipo} />)}
      </ul>
    </div>
  );
}

function ReviewSettingField({
  enabled,
  disabled = false,
}: {
  enabled: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="review-setting-field">
      <span className="field-label-with-help">
        <span>Revisão de Atas</span>
        <details
          className="schedule-time-help review-setting-help"
          onMouseEnter={(event) => { event.currentTarget.open = true; }}
          onMouseLeave={(event) => {
            if (!event.currentTarget.contains(document.activeElement)) {
              event.currentTarget.open = false;
            }
          }}
          onFocus={(event) => { event.currentTarget.open = true; }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              event.currentTarget.open = false;
            }
          }}
        >
          <summary aria-label="Informações sobre a revisão de atas">
            <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
          </summary>
          <p>
            Quando ativada, novas atas ficam pendentes e só entram nos relatórios depois de
            aprovadas pelo responsável ou administrador. Desativada (padrão), são aprovadas
            automaticamente. Alterar esta opção não muda atas já enviadas.
          </p>
        </details>
      </span>
      <select
        name="revisao_atas_ativa"
        defaultValue={enabled ? "on" : ""}
        disabled={disabled}
      >
        <option value="on">Aprovação ativada</option>
        <option value="">Aprovação desativada (padrão)</option>
      </select>
      {disabled && (
        <input type="hidden" name="revisao_atas_ativa" value={enabled ? "on" : ""} />
      )}
    </label>
  );
}

type MesaServerDraft = {
  clientId: string;
  grupo_servidor_mesa_id?: string;
  encargo: string;
  encargoOutro: boolean;
  nome: string;
  data_inicio: string;
  ativo: boolean;
  ordem: number;
};

function clientId() {
  return crypto.randomUUID();
}

function mesaDraftsFrom(
  servidores: readonly GrupoServidorMesa[],
): MesaServerDraft[] {
  return servidores
    .filter((item) => item.ativo)
    .sort(
      (first, second) =>
        first.ordem - second.ordem ||
        first.encargo.localeCompare(second.encargo, "pt-BR"),
    )
    .map((item) => ({
      clientId: item.grupo_servidor_mesa_id,
      grupo_servidor_mesa_id: item.grupo_servidor_mesa_id,
      encargo: item.encargo,
      encargoOutro: !KNOWN_MESA_OFFICES.some((office) => office === item.encargo),
      nome: item.nome || "vago",
      data_inicio: item.data_inicio,
      ativo: true,
      ordem: item.ordem,
    }));
}

function mesaPayloadFromDrafts(drafts: readonly MesaServerDraft[]) {
  return drafts
    .map((item, index) => ({
      grupo_servidor_mesa_id: item.grupo_servidor_mesa_id || undefined,
      encargo: item.encargo.trim(),
      nome: item.nome.trim() || "vago",
      data_inicio: isVacantMesaName(item.nome) ? "" : item.data_inicio,
      ativo: item.ativo,
      ordem: index + 1,
    }))
    .filter((item) => item.encargo);
}

function mesaPayloadFromPersisted(servidores: readonly GrupoServidorMesa[]) {
  return servidores
    .filter((item) => item.ativo)
    .sort(
      (first, second) =>
        first.ordem - second.ordem ||
        first.encargo.localeCompare(second.encargo, "pt-BR"),
    )
    .map((item, index) => ({
      grupo_servidor_mesa_id: item.grupo_servidor_mesa_id,
      encargo: item.encargo.trim(),
      nome: item.nome.trim() || "vago",
      data_inicio: isVacantMesaName(item.nome) ? "" : item.data_inicio,
      ativo: item.ativo,
      ordem: index + 1,
    }))
    .filter((item) => item.encargo);
}

function displayMesaDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "-";
}

function MesaServersEditor({
  grupoId = "",
  servidores,
  disabled = false,
  informativeNotice = "",
  errorNotice = "",
  summaryMode = false,
  hideSummaryHeading = false,
  startDisabled = false,
  onStartEditing,
}: {
  grupoId?: string;
  servidores: GrupoServidorMesa[];
  disabled?: boolean;
  informativeNotice?: string;
  errorNotice?: string;
  summaryMode?: boolean;
  hideSummaryHeading?: boolean;
  startDisabled?: boolean;
  onStartEditing?: () => void;
}) {
  const [drafts, setDrafts] = useState(() => mesaDraftsFrom(servidores));
  const [editing, setEditing] = useState(!summaryMode);
  const payload = mesaPayloadFromDrafts(drafts);

  if (summaryMode) {
    return (
      <MesaServersSummary
        grupoId={grupoId}
        servidores={servidores}
        disabled={startDisabled}
        informativeNotice={informativeNotice}
        hideHeading={hideSummaryHeading}
      />
    );
  }

  function updateDraft(
    clientId: string,
    patch: Partial<Omit<MesaServerDraft, "clientId">>,
  ) {
    setDrafts((current) =>
      current.map((item) =>
        item.clientId === clientId ? { ...item, ...patch } : item,
      ),
    );
  }

  return (
    <section className="responsavel-config-section mesa-servers-section">
      {editing && (
        <input type="hidden" name="servidores_mesa" value={JSON.stringify(payload)} />
      )}
      {errorNotice && <p className="form-error" role="alert">{errorNotice}</p>}
      {informativeNotice && (
        <p className="mesa-info-notice" role="status">{informativeNotice}</p>
      )}
      <div className="mesa-servers-header">
        <div>
          <h2>Servidores</h2>
        </div>
        {editing && (
          <button
            type="button"
            className="secondary mesa-add-button"
            disabled={disabled}
            onClick={() =>
              setDrafts((current) => [
                ...current,
                {
                  clientId: clientId(),
                  encargo: "",
                  encargoOutro: false,
                  nome: "vago",
                  data_inicio: "",
                  ativo: true,
                  ordem: Math.max(0, ...current.map((item) => item.ordem)) + 1,
                },
              ])
            }
          >
            <span className="button-content">
              <FontAwesomeIcon icon={faPlus} />
              Adicionar Servidores
            </span>
          </button>
        )}
      </div>

      {!editing ? (
        <div className="schedule-editor">
          <div className="table-wrap">
            <table className="schedule-summary-table mesa-summary-table">
              <thead>
                <tr>
                  <th>Encargo</th>
                  <th>Servidor</th>
                  <th>Desde</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((item) => {
                  const vacant = isVacantMesaName(item.nome);
                  return (
                    <tr key={item.clientId}>
                      <th scope="row">{item.encargo}</th>
                      <td className={vacant ? "mesa-vacant-value" : undefined}>
                        {vacant ? "Vago" : item.nome}
                      </td>
                      <td className={!item.data_inicio ? "mesa-vacant-value" : undefined}>
                        {displayMesaDate(item.data_inicio)}
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
              disabled={startDisabled}
              onClick={() => {
                setDrafts(mesaDraftsFrom(servidores));
                setEditing(true);
                onStartEditing?.();
              }}
            >
              <span className="button-content">
                <FontAwesomeIcon icon={faPenToSquare} />
                Editar servidores da mesa
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mesa-servers-grid">
          <div className="mesa-server-column-labels" aria-hidden="true">
            <span>Encargo</span>
            <span>Nome</span>
            <span>Desde</span>
          </div>
          {drafts.map((item, index) => {
            const vacant = isVacantMesaName(item.nome);
            const rowName = item.encargo || `encargo ${index + 1}`;
            return (
              <div
                className="mesa-server-row"
                key={item.clientId}
              >
                <div className="mesa-server-control">
                  <select
                    required
                    value={
                      !item.encargoOutro
                        ? item.encargo
                        : "outro"
                    }
                    disabled={disabled}
                    aria-label={`Encargo da mesa ${index + 1}`}
                    onChange={(event) => {
                      const choice = event.target.value;
                      updateDraft(item.clientId, {
                        encargoOutro: choice === "outro",
                        encargo: choice === "outro"
                          ? item.encargoOutro ? item.encargo : ""
                          : choice,
                      });
                    }}
                  >
                    <option value="" disabled>Selecione um encargo</option>
                    {KNOWN_MESA_OFFICES.map((office) => (
                      <option key={office} value={office}>{office}</option>
                    ))}
                    <option value="outro">Outro</option>
                  </select>
                  {item.encargoOutro && (
                    <input
                      required
                      value={item.encargo}
                      readOnly={disabled}
                      aria-label={`Nome do encargo ${index + 1}`}
                      onChange={(event) => updateDraft(item.clientId, { encargo: event.target.value })}
                    />
                  )}
                </div>
                <div className="mesa-server-control">
                  <input
                    value={item.nome}
                    readOnly={disabled}
                    className={vacant ? "mesa-vacant-input" : undefined}
                    aria-label={`Nome do Servidor de ${rowName}`}
                    onFocus={(event) => {
                      if (vacant) event.currentTarget.select();
                    }}
                    onClick={(event) => {
                      if (vacant) event.currentTarget.select();
                    }}
                    onChange={(event) => {
                      const nome = event.target.value;
                      updateDraft(item.clientId, {
                        nome,
                        data_inicio: isVacantMesaName(nome) ? "" : item.data_inicio,
                      });
                    }}
                  />
                </div>
                <div className="mesa-server-control">
                  <input
                    type="date"
                    value={vacant ? "" : item.data_inicio}
                    disabled={disabled || vacant}
                    required={!vacant}
                    className={vacant ? "mesa-vacant-date" : undefined}
                    aria-label={`Desde de ${rowName}`}
                    onChange={(event) =>
                      updateDraft(item.clientId, {
                        data_inicio: event.target.value,
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="danger-icon-button mesa-remove-button"
                  disabled={disabled}
                  aria-label={`Remover encargo ${item.encargo || "extra"}`}
                  title="Remover encargo"
                  onClick={() =>
                    setDrafts((current) =>
                      current.filter((draft) => draft.clientId !== item.clientId),
                    )
                  }
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TimedMessage({
  message,
  type,
  durationMs,
  onDismiss,
}: {
  message: string;
  type: "error" | "success";
  durationMs?: number;
  onDismiss?: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!message || !durationMs) return;
    const timeout = window.setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, durationMs);
    return () => window.clearTimeout(timeout);
  }, [durationMs, message, onDismiss]);

  if (!message || !visible) return null;

  return (
    <div
      className={`timed-message ${type === "error" ? "form-error" : "form-success"}`}
      role={type === "error" ? "alert" : "status"}
    >
      <span>{message}</span>
      <button
        type="button"
        className="message-close"
        aria-label="Fechar mensagem"
        onClick={() => {
          setVisible(false);
          onDismiss?.();
        }}
      >
        x
      </button>
    </div>
  );
}

export function GroupEditor({
  group,
  horarios,
  plataformas = [],
  servidoresMesa,
  canCreate,
  canManageAccess = canCreate,
  activationPath = "",
  activationExpired = false,
  status,
  publicOrigin = "",
  initialOpenSection = "",
  keepNewGroupRoute = false,
  variant = "default",
}: {
  group?: Grupo;
  horarios: GrupoHorario[];
  plataformas?: GrupoPlataforma[];
  servidoresMesa?: GrupoServidorMesa[];
  canCreate: boolean;
  canManageAccess?: boolean;
  activationPath?: string;
  activationExpired?: boolean;
  status?: string;
  publicOrigin?: string;
  initialOpenSection?: string;
  keepNewGroupRoute?: boolean;
  variant?: "default" | "responsavel";
}) {
  const [state, action, pending] = useActionState(saveGrupoAction, null);
  const [mesaState, mesaAction, mesaPending] = useActionState(
    saveGrupoServidoresMesaAction,
    null,
  );
  const [responsavelEditing, setResponsavelEditing] = useState(false);
  const [mesaEditing, setMesaEditing] = useState(false);
  const [mesaEditorVersion, setMesaEditorVersion] = useState(0);
  const [responsavelFormMessage, setResponsavelFormMessage] = useState("");
  const [mesaFormMessage, setMesaFormMessage] = useState("");
  const responsavelFormRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const current = group ?? emptyGroup;
  const hasRegisteredPlatforms = plataformas.some(
    (platform) => platform.grupo_id === current.grupo_id,
  );
  const hasActivePlatforms = plataformas.some(
    (platform) => platform.grupo_id === current.grupo_id && platform.ativo,
  );
  const openPlatformsByDefault = Boolean(
    group && !initialOpenSection && !hasRegisteredPlatforms,
  );
  const platformSetupMessage = hasRegisteredPlatforms
    ? "Ative pelo menos uma plataforma para liberar o cadastro dos horários do grupo."
    : "Cadastre pelo menos uma plataforma para depois cadastrar os horários do grupo.";
  const [active, setActive] = useState(current.ativo);
  const hasSecureAtaLink = isSecureAtaLinkToken(current.link_formulario_ata);
  const publicPath = hasSecureAtaLink
    ? `/preencher/${current.link_formulario_ata}`
    : "";
  const publicLink =
    publicPath && publicOrigin
      ? `${publicOrigin.replace(/\/$/, "")}${publicPath}`
      : publicPath;
  const successMessage =
    status === "activation-invite-sent"
      ? "Alterações salvas. Um novo convite foi enviado para o e-mail de login do grupo."
      : status === "activation-invite-rotated"
        ? "Convite rotacionado. Um novo link foi enviado para o e-mail de login do grupo."
        : status === "activation-invite-rotated-email-failed"
          ? "Convite rotacionado, mas o e-mail não foi enviado. Copie o novo link manualmente."
          : status === "activation-invite-unavailable"
            ? "Não há convite pendente disponível para rotacionar."
            : status === "ata-link-rotated"
              ? "Link de preenchimento rotacionado. O link anterior foi invalidado."
              : status === "saved" || status === "saved-mesa-missing-names"
                ? "Alterações salvas."
                : status === "created"
                  ? "Grupo criado."
                  : "";
  const dismissStatus = useCallback(() => {
    if (!status) return;
    const baseDestination =
      keepNewGroupRoute && group
        ? `${pathname}?grupoId=${encodeURIComponent(group.grupo_id)}`
        : pathname;
    const destination = initialOpenSection
      ? `${baseDestination}${baseDestination.includes("?") ? "&" : "?"}settingsSection=${encodeURIComponent(initialOpenSection)}`
      : baseDestination;
    router.replace(destination, { scroll: false });
  }, [group, initialOpenSection, keepNewGroupRoute, pathname, router, status]);
  const formId =
    variant === "responsavel" ? "responsavel-configuracoes-form" : undefined;
  function ataLinkControls() {
    if (!publicLink) {
      return (
        <div className="ata-link-controls">
          <p className="muted">
            O link de preenchimento será gerado automaticamente ao salvar ou rotacionar.
          </p>
          {group && (
            <button
              type="submit"
              className="icon-button ata-link-rotate-button"
              formAction={rotateAtaLinkAction}
              formNoValidate
              value="rotate-ata-link"
              disabled={pending}
              aria-label="Rotacionar link de preenchimento"
              title="Rotacionar link"
            >
              <FontAwesomeIcon icon={faRotateRight} />
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="ata-link-controls">
        <CopyableLink
          value={publicLink}
          displayValue={publicLink}
          label="Link da ata"
          trailingAction={
            <button
              type="submit"
              className="icon-button ata-link-rotate-button"
              formAction={rotateAtaLinkAction}
              formNoValidate
              value="rotate-ata-link"
              disabled={pending}
              aria-label="Rotacionar link de preenchimento"
              title="Rotacionar link"
            >
              <FontAwesomeIcon icon={faRotateRight} />
            </button>
          }
        />
      </div>
    );
  }

  function currentResponsavelPayload(formData: FormData) {
    return {
      revisao_atas_ativa: String(formData.get("revisao_atas_ativa") ?? "") === "on",
      acesso_plataforma: String(formData.get("acesso_plataforma") ?? "").trim(),
      plataforma: String(formData.get("plataforma") ?? ""),
      fuso_horario: String(formData.get("fuso_horario") ?? ""),
      ultima_reuniao_anterior: Number(formData.get("ultima_reuniao_anterior") ?? 0),
    };
  }

  function originalResponsavelPayload() {
    return {
      revisao_atas_ativa: current.revisao_atas_ativa === true,
      acesso_plataforma: current.acesso_plataforma.trim(),
      plataforma: current.plataforma,
      fuso_horario: current.fuso_horario,
      ultima_reuniao_anterior: current.ultima_reuniao_anterior,
    };
  }

  function hasGroupDataChanges(formData: FormData) {
    const next = currentResponsavelPayload(formData);
    const original = originalResponsavelPayload();
    return JSON.stringify(next) !== JSON.stringify(original);
  }

  function hasMesaChanges(formData: FormData) {
    const nextMesaPayload = String(formData.get("servidores_mesa") ?? "");
    const originalMesaPayload = JSON.stringify(
      mesaPayloadFromPersisted(servidoresMesa ?? []),
    );
    return nextMesaPayload !== originalMesaPayload;
  }

  function startResponsavelEditing() {
    setResponsavelFormMessage("");
    setMesaFormMessage("");
    setResponsavelEditing(true);
  }

  function startMesaEditing() {
    setResponsavelFormMessage("");
    setMesaFormMessage("");
    setMesaEditing(true);
  }

  function cancelResponsavelEditing() {
    responsavelFormRef.current?.reset();
    setResponsavelFormMessage("");
    setMesaFormMessage("");
    setResponsavelEditing(false);
    setMesaEditing(false);
    setMesaEditorVersion((currentVersion) => currentVersion + 1);
  }

  function submitResponsavelForm(event: React.FormEvent<HTMLFormElement>) {
    if (isSubmitFromAnotherForm(event)) {
      return;
    }
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (
      submitter instanceof HTMLButtonElement &&
      submitter.value === "rotate-ata-link"
    ) {
      return;
    }
    const mesaSubmit =
      submitter instanceof HTMLButtonElement && submitter.value === "save-mesa";
    if ((mesaSubmit && !mesaEditing) || (!mesaSubmit && !responsavelEditing)) {
      event.preventDefault();
      return;
    }
    const formData = new FormData(event.currentTarget);
    const hasChanges = mesaSubmit
      ? hasMesaChanges(formData)
      : hasGroupDataChanges(formData);
    if (!hasChanges) {
      event.preventDefault();
      if (mesaSubmit) {
        setMesaFormMessage("Nenhuma alteração para salvar.");
      } else {
        setResponsavelFormMessage("Nenhuma alteração para salvar.");
      }
      return;
    }
    setResponsavelFormMessage("");
    setMesaFormMessage("");
  }

  if (variant === "responsavel") {
    return (
      <div className="responsavel-config-page">
        <header className="responsavel-page-header">
          <div>
            <p className="eyebrow">Configurações</p>
            <h1>GRUPO {current.grupo_nome.toLocaleUpperCase("pt-BR")}</h1>
            <p className="responsavel-page-description">
              Gerencie os dados, acessos e horários do grupo.
            </p>
          </div>
        </header>

        <form
          id={formId}
          ref={responsavelFormRef}
          action={action}
          className="creation-form responsavel-config-form"
          onSubmit={submitResponsavelForm}
        >
          <input type="hidden" name="grupo_id" value={current.grupo_id} />
          <input type="hidden" name="grupo_nome" value={current.grupo_nome} />
          {!state?.error && successMessage && (
            <TimedMessage
              key={`success-${successMessage}`}
              message={successMessage}
              type="success"
              onDismiss={dismissStatus}
            />
          )}
          <section className="card responsavel-config-panel">
            <section className="responsavel-config-section">
              {state?.error && (
                <TimedMessage
                  key={`error-${state.error}`}
                  message={state.error}
                  type="error"
                />
              )}
              {responsavelFormMessage && responsavelEditing && (
                <p className="form-error" role="status">{responsavelFormMessage}</p>
              )}
              <div className="responsavel-group-data-heading">
                <h2>Dados do Grupo</h2>
                {!responsavelEditing && (
                  <button
                    className="responsavel-edit-group-button"
                    type="button"
                    disabled={mesaEditing}
                    onClick={startResponsavelEditing}
                  >
                    <span className="button-content">
                      <FontAwesomeIcon icon={faPenToSquare} />
                      Editar Dados do Grupo
                    </span>
                  </button>
                )}
              </div>
              <div className="form-grid responsavel-config-grid">
                <ReviewSettingField
                  enabled={current.revisao_atas_ativa === true}
                  disabled={!responsavelEditing}
                />
                <input type="hidden" name="acesso_plataforma" value={current.acesso_plataforma} />
                <input type="hidden" name="plataforma" value={current.plataforma} />
                <input type="hidden" name="fuso_horario" value={current.fuso_horario} />
                <div className="responsavel-email-field">
                  <label>
                    E-mail
                    <input
                      name="email_acesso_grupo"
                      type="email"
                      required={canManageAccess}
                      defaultValue={current.email_acesso_grupo}
                      readOnly
                    />
                  </label>
                  {group && current.grupo_id && (
                    <EmailChangeDialog
                      groupId={current.grupo_id}
                      currentEmail={current.email_acesso_grupo}
                    />
                  )}
                </div>
                {ataLinkControls()}
                <label>
                  Última reunião antes do sistema
                  <input
                    name="ultima_reuniao_anterior"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={current.ultima_reuniao_anterior}
                    readOnly={!responsavelEditing}
                  />
                </label>
              </div>
              <GroupPlatformsSummary platforms={plataformas} />
            </section>
            {responsavelEditing ? (
              <div className="form-footer group-save-footer">
                <button className="group-wide-action" type="submit" disabled={pending}>
                  <span className="button-content">
                    <FontAwesomeIcon icon={faFloppyDisk} />
                    Salvar alterações
                  </span>
                </button>
                <button
                  className="secondary"
                  type="button"
                  disabled={pending}
                  onClick={cancelResponsavelEditing}
                >
                  Cancelar
                </button>
              </div>
            ) : null}
          </section>

          {group && (
            <details className="card responsavel-config-panel settings-accordion" open={initialOpenSection === "servers"}>
              <summary className="settings-accordion-summary">
                <span>Servidores da Mesa</span>
                <FontAwesomeIcon className="settings-accordion-chevron" icon={faChevronDown} aria-hidden="true" />
              </summary>
              <div className="settings-accordion-content">
              <input type="hidden" name="settings_section" value="servers" />
              <MesaServersEditor
                key={`${status ?? ""}:${mesaEditorVersion}:${JSON.stringify(mesaPayloadFromPersisted(servidoresMesa ?? []))}`}
                grupoId={current.grupo_id}
                servidores={servidoresMesa ?? []}
                disabled={!mesaEditing || mesaPending}
                errorNotice={mesaState?.error ?? mesaFormMessage}
                summaryMode
                hideSummaryHeading
                startDisabled={responsavelEditing || mesaPending}
                onStartEditing={startMesaEditing}
              />
              {mesaEditing && (
                <div className="form-footer group-save-footer">
                  <button
                    className="group-wide-action"
                    type="submit"
                    value="save-mesa"
                    formAction={mesaAction}
                    disabled={mesaPending}
                  >
                    <span className="button-content">
                      <FontAwesomeIcon icon={faFloppyDisk} />
                      Salvar alterações
                    </span>
                  </button>
                  <button
                    className="secondary"
                    type="button"
                    disabled={mesaPending}
                    onClick={cancelResponsavelEditing}
                  >
                    Cancelar
                  </button>
                </div>
              )}
              </div>
            </details>
          )}

          {!group && responsavelEditing && (
            <section className="card responsavel-config-panel">
              <div className="form-footer group-save-footer">
                <button className="group-wide-action" type="submit" disabled={pending}>
                  <span className="button-content">
                    <FontAwesomeIcon icon={faFloppyDisk} />
                    Salvar alterações
                  </span>
                </button>
                <button
                  className="secondary"
                  type="button"
                  disabled={pending}
                  onClick={cancelResponsavelEditing}
                >
                  Cancelar
                </button>
              </div>
            </section>
          )}
        </form>

        {group && (
          <>
            <details className="card responsavel-config-panel settings-accordion" open={initialOpenSection === "platforms" || openPlatformsByDefault}>
              <summary className="settings-accordion-summary">
                <span>Plataformas</span>
                <FontAwesomeIcon className="settings-accordion-chevron" icon={faChevronDown} aria-hidden="true" />
              </summary>
              <div className="settings-accordion-content">
                {!hasActivePlatforms && (
                  <p className="platforms-locked-message" role="status">
                    {platformSetupMessage}
                  </p>
                )}
                <GroupPlatformsEditor
                  grupoId={group.grupo_id}
                  platforms={plataformas}
                  schedules={horarios}
                  isAdmin={canCreate}
                  embedded
                />
              </div>
            </details>
            <details className="card responsavel-config-panel responsavel-config-section responsavel-schedules-section settings-accordion" open={initialOpenSection === "schedules"}>
              <summary className="settings-accordion-summary">
                <span className="settings-accordion-title-with-help">
                  <span>Horários de Reunião</span>
                  <ScheduleTimeHelp />
                </span>
                <FontAwesomeIcon className="settings-accordion-chevron" icon={faChevronDown} aria-hidden="true" />
              </summary>
              <div className="settings-accordion-content">
                <PlatformLegend />
                <GroupSchedulesEditor grupoId={group.grupo_id} horarios={horarios} plataformas={plataformas} />
              </div>
            </details>
          </>
        )}
      </div>
    );
  }

  return (
    <main className="shell form-shell">
      <Link className="back-link" href={canCreate ? "/admin/grupos" : "/"}>
        <span className="button-content">
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar
        </span>
      </Link>
      <header>
        <p className="eyebrow">Grupo</p>
        <h1>{group ? current.grupo_nome : "Novo grupo"}</h1>
      </header>

      <form action={action} className="creation-form">
        <input type="hidden" name="grupo_id" value={current.grupo_id} />
        {keepNewGroupRoute ? <input type="hidden" name="return_to_new_group_page" value="on" /> : null}
        <input type="hidden" name="ativo" value={active ? "on" : ""} />
        {state?.error && (
          <TimedMessage
            key={`error-${state.error}`}
            message={state.error}
            type="error"
            durationMs={10000}
          />
        )}
        {!state?.error && successMessage && (
          <TimedMessage
            key={`success-${successMessage}`}
            message={successMessage}
            type="success"
            durationMs={6000}
            onDismiss={dismissStatus}
          />
        )}
        <section className="card form-section">
          <h2>Dados do Grupo</h2>
          <div className="form-grid">
            <label>
              Nome
              <input name="grupo_nome" required defaultValue={current.grupo_nome} />
            </label>
            <ReviewSettingField enabled={current.revisao_atas_ativa === true} />
            <input type="hidden" name="fuso_horario" value={current.fuso_horario} />
            {canManageAccess && (
              <label>
                Grupo ativo
                <select
                  value={active ? "ativo" : "inativo"}
                  onChange={(event) => setActive(event.target.value === "ativo")}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </label>
            )}
            <label>
              Última reunião antes do sistema
              <input
                name="ultima_reuniao_anterior"
                type="number"
                min={0}
                step={1}
                defaultValue={current.ultima_reuniao_anterior}
              />
            </label>
          </div>
          {group ? (
            <>
              <div className={canManageAccess ? "group-access-top-row" : "group-access-top-row group-access-top-row-single"}>
                {ataLinkControls()}
                {canManageAccess && (
                  <label>
                    E-mail
                    <input
                      name="email_acesso_grupo"
                      type="email"
                      required
                      defaultValue={current.email_acesso_grupo}
                    />
                  </label>
                )}
              </div>
              {canManageAccess ? (
                <div className="group-access-bottom-section">
                  {activationPath && (
                    <div className="group-access-bottom-row">
                      <div className="group-activation-link">
                        <CopyableLink
                          value={activationPath}
                          displayValue={`Ativar acesso ${current.grupo_nome}`}
                          label="Link de ativação do acesso do grupo"
                          trailingAction={
                            <button
                              type="submit"
                              className="icon-button ata-link-rotate-button"
                              formAction={rotateActivationInviteAction}
                              formNoValidate
                              value="rotate-activation-invite"
                              disabled={pending}
                              aria-label="Rotacionar convite de ativação"
                              title="Rotacionar convite"
                            >
                              <FontAwesomeIcon icon={faRotateRight} />
                            </button>
                          }
                        />
                        {activationExpired && (
                          <p className="field-hint">
                            Este convite expirou. Rotacione-o para gerar um novo link válido.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="group-data-save-platform-row">
                    <GroupPlatformsSummary platforms={plataformas} />
                    <button className="group-wide-action group-data-save-action" type="submit" disabled={pending}>
                      <span className="button-content">
                        <FontAwesomeIcon icon={faFloppyDisk} />
                        Salvar dados do grupo
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <GroupPlatformsSummary platforms={plataformas} />
              )}
            </>
          ) : (
            canManageAccess && (
              <div className="form-grid">
                <label>
                  E-mail
                  <input
                    name="email_acesso_grupo"
                    type="email"
                    required
                    defaultValue={current.email_acesso_grupo}
                  />
                </label>
              </div>
            )
          )}
        </section>

        {group && (
          <details className="card form-section settings-accordion" open={initialOpenSection === "servers"}>
            <summary className="settings-accordion-summary">
              <span>Servidores da Mesa</span>
              <FontAwesomeIcon className="settings-accordion-chevron" icon={faChevronDown} aria-hidden="true" />
            </summary>
            <div className="settings-accordion-content">
            <MesaServersEditor
              grupoId={current.grupo_id}
              servidores={servidoresMesa ?? []}
              summaryMode
              hideSummaryHeading
            />
            </div>
          </details>
        )}

        {!group && (
          <div className="form-footer group-save-footer">
            <button className="group-wide-action" type="submit" disabled={pending}>
              <span className="button-content">
                <FontAwesomeIcon icon={faFloppyDisk} />
                Criar grupo
              </span>
            </button>
          </div>
        )}
      </form>

      {group ? (
        <>
          <details className="card form-section settings-accordion" open={initialOpenSection === "platforms" || openPlatformsByDefault}>
            <summary className="settings-accordion-summary">
              <span>Plataformas</span>
              <FontAwesomeIcon className="settings-accordion-chevron" icon={faChevronDown} aria-hidden="true" />
            </summary>
            <div className="settings-accordion-content">
              {!hasActivePlatforms && (
                <p className="platforms-locked-message" role="status">
                  {platformSetupMessage}
                </p>
              )}
              <GroupPlatformsEditor
                grupoId={group.grupo_id}
                platforms={plataformas}
                schedules={horarios}
                isAdmin={canCreate}
                isGroupActive={active}
                returnToNewGroupPage={keepNewGroupRoute}
                embedded
              />
            </div>
          </details>
          <details className="card form-section settings-accordion" open={initialOpenSection === "schedules"}>
            <summary className="settings-accordion-summary">
              <span className="settings-accordion-title-with-help">
                <span>Horários de Reunião</span>
                <ScheduleTimeHelp />
              </span>
              <FontAwesomeIcon className="settings-accordion-chevron" icon={faChevronDown} aria-hidden="true" />
            </summary>
            <div className="settings-accordion-content">
              <PlatformLegend />
              {!active ? (
                <p className="platforms-locked-message" role="status">Ative o grupo para cadastrar os horários.</p>
              ) : hasActivePlatforms ? (
                <GroupSchedulesEditor
                  grupoId={group.grupo_id}
                  horarios={horarios}
                  plataformas={plataformas}
                  returnToNewGroupPage={keepNewGroupRoute}
                />
              ) : (
                <p className="platforms-locked-message" role="status">{platformSetupMessage}</p>
              )}
            </div>
          </details>
        </>
      ) : (
        <section className="card group-platforms-editor" aria-labelledby="group-platforms-title">
          <h2 id="group-platforms-title">Plataformas</h2>
          <p className="platforms-locked-message" role="status">Crie o grupo primeiro para depois cadastrar as plataformas.</p>
        </section>
      )}
    </main>
  );
}
