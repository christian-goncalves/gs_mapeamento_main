"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState } from "react";
import { faArrowLeft, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Grupo, GrupoHorario } from "@/domain/entities";
import { saveGrupoAction } from "./actions";
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
  durationMs: number;
  onDismiss?: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!message) return;
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
}: {
  group?: Grupo;
  horarios: GrupoHorario[];
  canCreate: boolean;
  canManageAccess?: boolean;
  activationPath?: string;
  status?: string;
}) {
  const [state, action, pending] = useActionState(saveGrupoAction, null);
  const router = useRouter();
  const pathname = usePathname();
  const current = group ?? emptyGroup;
  const publicLink = current.link_formulario_ata
    ? `/preencher/${current.link_formulario_ata}`
    : "";
  const successMessage =
    status === "activation-invite-sent"
      ? "Alterações salvas. Um novo convite foi enviado para o e-mail de login do grupo."
      : status === "saved"
        ? "Alterações salvas."
        : status === "created"
          ? "Grupo criado."
          : "";
  const dismissStatus = useCallback(() => {
    if (status) router.replace(pathname, { scroll: false });
  }, [pathname, router, status]);

  return (
    <main className="shell form-shell">
      <Link className="back-link" href={canCreate ? "/grupos" : "/"}>
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
              Zoom ID
              <input
                name="zoom_id"
                required
                pattern="(\d{8,12}|https?://.*\.?zoom\.us/.*)"
                title="Informe um ID numérico do Zoom ou uma URL válida do Zoom."
                defaultValue={current.zoom_id}
              />
            </label>
            {canManageAccess && (
              <label className="choice">
                <input
                  name="ativo"
                  type="checkbox"
                  defaultChecked={current.ativo}
                />
                Grupo ativo
              </label>
            )}
          </div>
        </section>

        <section className="card form-section">
          <h2>Acesso e responsáveis</h2>
          <div className="form-grid">
            <label>
              Responsável pelo grupo
              <input
                name="responsavel_grupo_nome"
                required={canManageAccess}
                defaultValue={current.responsavel_grupo_nome}
                readOnly={!canManageAccess}
              />
            </label>
            <label>
              E-mail do responsável
              <input
                name="responsavel_grupo_email"
                type="email"
                required={canManageAccess}
                defaultValue={current.responsavel_grupo_email}
                readOnly={!canManageAccess}
              />
            </label>
            <label>
              E-mail de login do grupo
              <input
                name="email_acesso_grupo"
                type="email"
                required={canManageAccess}
                defaultValue={current.email_acesso_grupo}
                readOnly={!canManageAccess}
              />
            </label>
          </div>
          {publicLink && (
            <CopyableLink
              value={publicLink}
              displayValue={`Ata ${current.grupo_nome}`}
              label="Link para preenchimento da ata"
            />
          )}
          {!publicLink && (
            <p className="muted">
              O link de preenchimento será gerado automaticamente ao salvar.
            </p>
          )}
          {activationPath && canManageAccess && (
            <CopyableLink
              value={activationPath}
              displayValue={`Ativar acesso ${current.grupo_nome}`}
              label="Link de ativação do responsável"
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
