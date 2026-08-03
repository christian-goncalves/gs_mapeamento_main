"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import {
  faArrowLeft,
  faClock,
  faFileLines,
  faFloppyDisk,
  faPenToSquare,
  faPlus,
  faRotateRight,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Grupo, GrupoHorario } from "@/domain/entities";
import { fusoHorarioMapping, plataformaMapping } from "@/domain/enums";
import {
  DEFAULT_MESA_OFFICES,
  isVacantMesaName,
} from "@/domain/grupo-servidores-mesa";
import type { GrupoServidorMesa } from "@/domain/schemas";
import { isSecureAtaLinkToken } from "@/lib/ata-link-token";
import {
  rotateAtaLinkAction,
  saveGrupoAction,
  saveGrupoServidoresMesaAction,
} from "./actions";
import { CopyableLink } from "./copyable-link";
import { GroupSchedulesEditor } from "./group-schedules-editor";
import { MesaServersSummary } from "./mesa-servers-summary";

const emptyGroup: Grupo = {
  grupo_id: "",
  zoom_id: "",
  grupo_nome: "",
  ordem: 1,
  ativo: true,
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

const MESA_MISSING_NAMES_NOTICE =
  "Você não adicionou os nomes dos encargos de RSG, RSG Suplente, Secretário e Tesoureiro. Você poderá voltar a qualquer momento para completar essas informações.";

type MesaServerDraft = {
  clientId: string;
  grupo_servidor_mesa_id?: string;
  encargo: string;
  nome: string;
  data_inicio: string;
  ativo: boolean;
  ordem: number;
  fixed: boolean;
};

function clientId() {
  return crypto.randomUUID();
}

function mesaDraftsFrom(
  servidores: readonly GrupoServidorMesa[],
): MesaServerDraft[] {
  const active = servidores.filter((item) => item.ativo);
  const byOffice = new Map(active.map((item) => [item.encargo, item]));
  const fixed = DEFAULT_MESA_OFFICES.map((encargo, index) => {
    const existing = byOffice.get(encargo);
    return {
      clientId: existing?.grupo_servidor_mesa_id ?? `fixed-${encargo}`,
      grupo_servidor_mesa_id: existing?.grupo_servidor_mesa_id,
      encargo,
      nome: existing?.nome || "vago",
      data_inicio: existing?.data_inicio ?? "",
      ativo: true,
      ordem: index + 1,
      fixed: true,
    };
  });
  const extras = active
    .filter(
      (item) =>
        !DEFAULT_MESA_OFFICES.some((defaultOffice) => defaultOffice === item.encargo),
    )
    .sort(
      (first, second) =>
        first.ordem - second.ordem ||
        first.encargo.localeCompare(second.encargo, "pt-BR"),
    )
    .map((item, index) => ({
      clientId: item.grupo_servidor_mesa_id,
      grupo_servidor_mesa_id: item.grupo_servidor_mesa_id,
      encargo: item.encargo,
      nome: item.nome || "vago",
      data_inicio: item.data_inicio,
      ativo: true,
      ordem: DEFAULT_MESA_OFFICES.length + index + 1,
      fixed: false,
    }));
  return [...fixed, ...extras];
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

function hasMissingDefaultMesaNames(payloadText: string) {
  try {
    const payload = JSON.parse(payloadText) as Array<{ encargo?: string; nome?: string }>;
    return DEFAULT_MESA_OFFICES.some((encargo) =>
      payload.some(
        (item) => item.encargo === encargo && isVacantMesaName(item.nome ?? ""),
      ),
    );
  } catch {
    return false;
  }
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
  startDisabled = false,
  onStartEditing,
}: {
  grupoId?: string;
  servidores: GrupoServidorMesa[];
  disabled?: boolean;
  informativeNotice?: string;
  errorNotice?: string;
  summaryMode?: boolean;
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
      />
    );
  }

  function updateDraft(
    clientId: string,
    patch: Partial<Omit<MesaServerDraft, "clientId" | "fixed">>,
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
          <h2>Servidores da Mesa</h2>
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
                  nome: "vago",
                  data_inicio: "",
                  ativo: true,
                  ordem: current.length + 1,
                  fixed: false,
                },
              ])
            }
          >
            <span className="button-content">
              <FontAwesomeIcon icon={faPlus} />
              Adicionar encargo
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
                  <th>Data de início</th>
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
          <span>Data de início</span>
        </div>
        {drafts.map((item, index) => {
          const vacant = isVacantMesaName(item.nome);
          const rowName = item.encargo || `encargo ${index + 1}`;
          return (
            <div
              className={
                item.fixed
                  ? "mesa-server-row mesa-server-row-fixed"
                  : "mesa-server-row"
              }
              key={item.clientId}
            >
              <div className="mesa-server-control">
                <input
                  required
                  value={item.encargo}
                  readOnly={item.fixed || disabled}
                  aria-label={`Encargo da mesa ${index + 1}`}
                  onChange={(event) =>
                    updateDraft(item.clientId, { encargo: event.target.value })
                  }
                />
              </div>
              <div className="mesa-server-control">
                <input
                  value={item.nome}
                  readOnly={disabled}
                  className={vacant ? "mesa-vacant-input" : undefined}
                  aria-label={`Nome do servidor de ${rowName}`}
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
                  aria-label={`Data de início de ${rowName}`}
                  onChange={(event) =>
                    updateDraft(item.clientId, {
                      data_inicio: event.target.value,
                    })
                  }
                />
              </div>
              {!item.fixed && (
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
              )}
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
  servidoresMesa,
  canCreate,
  canManageAccess = canCreate,
  activationPath = "",
  status,
  publicOrigin = "",
  variant = "default",
}: {
  group?: Grupo;
  horarios: GrupoHorario[];
  servidoresMesa?: GrupoServidorMesa[];
  canCreate: boolean;
  canManageAccess?: boolean;
  activationPath?: string;
  status?: string;
  publicOrigin?: string;
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
  const [mesaInfoMessage, setMesaInfoMessage] = useState("");
  const responsavelFormRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const current = group ?? emptyGroup;
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
      : status === "ata-link-rotated"
        ? "Link de preenchimento rotacionado. O link anterior foi invalidado."
      : status === "saved" || status === "saved-mesa-missing-names"
        ? "Alterações salvas."
        : status === "created"
          ? "Grupo criado."
          : "";
  const dismissStatus = useCallback(() => {
    if (status) router.replace(pathname, { scroll: false });
  }, [pathname, router, status]);
  const activeSchedulesCount = horarios.filter((horario) => horario.ativo).length;
  const formId =
    variant === "responsavel" ? "responsavel-configuracoes-form" : undefined;
  const mesaInformativeNotice =
    mesaInfoMessage || status === "saved-mesa-missing-names"
      ? MESA_MISSING_NAMES_NOTICE
      : "";

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
          label="Link para preenchimento da ata"
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
      grupo_nome: String(formData.get("grupo_nome") ?? "").trim(),
      acesso_plataforma: String(formData.get("acesso_plataforma") ?? "").trim(),
      plataforma: String(formData.get("plataforma") ?? ""),
      fuso_horario: String(formData.get("fuso_horario") ?? ""),
    };
  }

  function originalResponsavelPayload() {
    return {
      grupo_nome: current.grupo_nome.trim(),
      acesso_plataforma: current.acesso_plataforma.trim(),
      plataforma: current.plataforma,
      fuso_horario: current.fuso_horario,
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
    setMesaInfoMessage("");
    setResponsavelEditing(true);
  }

  function startMesaEditing() {
    setResponsavelFormMessage("");
    setMesaFormMessage("");
    setMesaInfoMessage("");
    setMesaEditing(true);
  }

  function cancelResponsavelEditing() {
    responsavelFormRef.current?.reset();
    setResponsavelFormMessage("");
    setMesaFormMessage("");
    setMesaInfoMessage("");
    setResponsavelEditing(false);
    setMesaEditing(false);
    setMesaEditorVersion((currentVersion) => currentVersion + 1);
  }

  function submitResponsavelForm(event: React.FormEvent<HTMLFormElement>) {
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
    const mesaPayload = String(formData.get("servidores_mesa") ?? "");
    if (mesaSubmit && group && hasMissingDefaultMesaNames(mesaPayload)) {
      setMesaInfoMessage(MESA_MISSING_NAMES_NOTICE);
    } else if (mesaSubmit && group) {
      setMesaInfoMessage("");
    }
  }

  if (variant === "responsavel") {
    return (
      <div className="responsavel-config-page">
        <header className="responsavel-page-header">
          <div>
            <p className="eyebrow">Responsável</p>
            <h1>GRUPO {current.grupo_nome.toLocaleUpperCase("pt-BR")}</h1>
            <p className="responsavel-page-description">
              Gerencie os dados, acessos e horários do grupo.
            </p>
          </div>
        </header>

        <section className="summary-cards" aria-label="Resumo das configurações do grupo">
          <dl className="summary-card">
            <span className="summary-icon summary-icon-active" aria-hidden="true">
              <FontAwesomeIcon icon={faClock} />
            </span>
            <div>
              <dt>Horários ativos</dt>
              <dd>{activeSchedulesCount}</dd>
            </div>
          </dl>
          <dl className="summary-card">
            <span className="summary-icon" aria-hidden="true">
              <FontAwesomeIcon icon={faFileLines} />
            </span>
            <div>
              <dt>Última reunião antes do sistema</dt>
              <dd>{current.ultima_reuniao_anterior}</dd>
            </div>
          </dl>
        </section>

        <form
          id={formId}
          ref={responsavelFormRef}
          action={action}
          className="creation-form responsavel-config-form"
          onSubmit={submitResponsavelForm}
        >
          <input type="hidden" name="grupo_id" value={current.grupo_id} />
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
              <h2>Dados do grupo</h2>
              <div className="form-grid responsavel-config-grid">
                <label>
                  Nome
                  <input
                    name="grupo_nome"
                    required
                    defaultValue={current.grupo_nome}
                    readOnly={!responsavelEditing}
                  />
                </label>
                <label>
                  Identificador/link da plataforma
                  <input
                    name="acesso_plataforma"
                    required
                    defaultValue={current.acesso_plataforma}
                    readOnly={!responsavelEditing}
                  />
                </label>
                <label>
                  Plataforma
                  <select name="plataforma" defaultValue={current.plataforma} disabled={!responsavelEditing}>
                    {plataformaMapping.codes.map((code) => (
                      <option key={code} value={code}>{plataformaMapping.toSheet(code)}</option>
                    ))}
                  </select>
                  {!responsavelEditing && <input type="hidden" name="plataforma" value={current.plataforma} />}
                </label>
                <label>
                  Fuso horário
                  <select name="fuso_horario" defaultValue={current.fuso_horario} disabled={!responsavelEditing}>
                    {fusoHorarioMapping.codes.map((code) => (
                      <option key={code} value={code}>{fusoHorarioMapping.toSheet(code)}</option>
                    ))}
                  </select>
                  {!responsavelEditing && <input type="hidden" name="fuso_horario" value={current.fuso_horario} />}
                </label>
                <label>
                  E-mail de login do grupo
                  <input
                    name="email_acesso_grupo"
                    type="email"
                    required={canManageAccess}
                    defaultValue={current.email_acesso_grupo}
                    readOnly={!responsavelEditing || !canManageAccess}
                  />
                </label>
                {ataLinkControls()}
              </div>
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
            ) : (
              <div className="section-footer schedule-view-footer">
                <button
                  className="group-wide-action"
                  type="button"
                  disabled={mesaEditing}
                  onClick={startResponsavelEditing}
                >
                  <span className="button-content">
                    <FontAwesomeIcon icon={faPenToSquare} />
                    Editar dados do grupo
                  </span>
                </button>
              </div>
            )}
          </section>

          {group && (
            <section className="card responsavel-config-panel">
              <MesaServersEditor
                key={`${status ?? ""}:${mesaEditorVersion}:${JSON.stringify(mesaPayloadFromPersisted(servidoresMesa ?? []))}`}
                grupoId={current.grupo_id}
                servidores={servidoresMesa ?? []}
                disabled={!mesaEditing || mesaPending}
                informativeNotice={mesaInformativeNotice}
                errorNotice={mesaState?.error ?? mesaFormMessage}
                summaryMode
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
            </section>
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
          <section className="card responsavel-config-panel responsavel-config-section responsavel-schedules-section">
            <h2>Horários do grupo</h2>
            <GroupSchedulesEditor grupoId={group.grupo_id} horarios={horarios} />
          </section>
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
          <h2>Dados do grupo</h2>
          <div className="form-grid">
            <label>
              Nome
              <input name="grupo_nome" required defaultValue={current.grupo_nome} />
            </label>
            <label>
              Identificador/link da plataforma
              <input
                name="acesso_plataforma"
                required
                defaultValue={current.acesso_plataforma}
              />
            </label>
            <label>
              Plataforma
              <select name="plataforma" defaultValue={current.plataforma}>
                {plataformaMapping.codes.map((code) => (
                  <option key={code} value={code}>{plataformaMapping.toSheet(code)}</option>
                ))}
              </select>
            </label>
            <label>
              Fuso horário
              <select name="fuso_horario" defaultValue={current.fuso_horario}>
                {fusoHorarioMapping.codes.map((code) => (
                  <option key={code} value={code}>{fusoHorarioMapping.toSheet(code)}</option>
                ))}
              </select>
            </label>
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
          {canManageAccess && (
            <div className="form-grid">
              <label>
                E-mail de login do grupo
                <input
                  name="email_acesso_grupo"
                  type="email"
                  required
                  defaultValue={current.email_acesso_grupo}
                />
              </label>
            </div>
          )}
          {group && ataLinkControls()}
          {activationPath && canManageAccess && (
            <CopyableLink
              value={activationPath}
              displayValue={`Ativar acesso ${current.grupo_nome}`}
              label="Link de ativação do acesso do grupo"
            />
          )}
        </section>

        {group && (
          <section className="card form-section">
            <MesaServersEditor
              grupoId={current.grupo_id}
              servidores={servidoresMesa ?? []}
              summaryMode
            />
          </section>
        )}

        <div className="form-footer group-save-footer">
          <button className="group-wide-action" type="submit" disabled={pending}>
            <span className="button-content">
              <FontAwesomeIcon icon={faFloppyDisk} />
              {group ? "Salvar alterações" : "Criar grupo"}
            </span>
          </button>
        </div>
      </form>

      {group && (
        <section className="card form-section">
          <h2>Horários do grupo</h2>
          <GroupSchedulesEditor grupoId={group.grupo_id} horarios={horarios} />
        </section>
      )}
    </main>
  );
}
