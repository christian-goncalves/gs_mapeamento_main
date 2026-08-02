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
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Grupo, GrupoHorario } from "@/domain/entities";
import { fusoHorarioMapping, plataformaMapping } from "@/domain/enums";
import { isSecureAtaLinkToken } from "@/lib/ata-link-token";
import { rotateAtaLinkAction, saveGrupoAction } from "./actions";
import { CopyableLink } from "./copyable-link";
import { GroupSchedulesEditor } from "./group-schedules-editor";

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
  canCreate,
  canManageAccess = canCreate,
  activationPath = "",
  status,
  publicOrigin = "",
  variant = "default",
}: {
  group?: Grupo;
  horarios: GrupoHorario[];
  canCreate: boolean;
  canManageAccess?: boolean;
  activationPath?: string;
  status?: string;
  publicOrigin?: string;
  variant?: "default" | "responsavel";
}) {
  const [state, action, pending] = useActionState(saveGrupoAction, null);
  const [responsavelEditing, setResponsavelEditing] = useState(false);
  const [responsavelFormMessage, setResponsavelFormMessage] = useState("");
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
      : status === "saved"
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
              name="intent"
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
              name="intent"
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

  function hasResponsavelChanges(formData: FormData) {
    const next = currentResponsavelPayload(formData);
    const original = originalResponsavelPayload();
    return JSON.stringify(next) !== JSON.stringify(original);
  }

  function startResponsavelEditing() {
    setResponsavelFormMessage("");
    setResponsavelEditing(true);
  }

  function cancelResponsavelEditing() {
    responsavelFormRef.current?.reset();
    setResponsavelFormMessage("");
    setResponsavelEditing(false);
  }

  function submitResponsavelForm(event: React.FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (
      submitter instanceof HTMLButtonElement &&
      submitter.value === "rotate-ata-link"
    ) {
      return;
    }
    if (!responsavelEditing) {
      event.preventDefault();
      return;
    }
    const formData = new FormData(event.currentTarget);
    if (!hasResponsavelChanges(formData)) {
      event.preventDefault();
      setResponsavelFormMessage("Nenhuma alteração para salvar.");
      return;
    }
    setResponsavelFormMessage("");
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
          {responsavelEditing ? (
            <div className="responsavel-header-actions">
              <button className="button-link" type="submit" form={formId} disabled={pending}>
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
            <button
              className="button-link"
              type="button"
              onClick={startResponsavelEditing}
            >
              <span className="button-content">
                <FontAwesomeIcon icon={faPenToSquare} />
                Editar
              </span>
            </button>
          )}
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

        <section className="card responsavel-config-panel">
          <form
            id={formId}
            ref={responsavelFormRef}
            action={action}
            className="creation-form"
            onSubmit={submitResponsavelForm}
          >
            <input type="hidden" name="grupo_id" value={current.grupo_id} />
            {state?.error && (
              <TimedMessage
                key={`error-${state.error}`}
                message={state.error}
                type="error"
              />
            )}
            {!state?.error && successMessage && (
              <TimedMessage
                key={`success-${successMessage}`}
                message={successMessage}
                type="success"
                onDismiss={dismissStatus}
              />
            )}
            {responsavelFormMessage && (
              <p className="form-error" role="status">{responsavelFormMessage}</p>
            )}

            <section className="responsavel-config-section">
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

            {responsavelEditing && (
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
            )}
          </form>
        </section>

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
