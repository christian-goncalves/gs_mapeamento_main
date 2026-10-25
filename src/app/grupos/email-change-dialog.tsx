"use client";

import { useActionState, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { faPenToSquare, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { requestResponsibleEmailChangeAction } from "./email-change-actions";

function EmailChangeForm({
  groupId,
  currentEmail,
  onClose,
}: {
  groupId: string;
  currentEmail: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(requestResponsibleEmailChangeAction, null);

  return (
    <div
      className="modal-backdrop email-change-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <section
        className="confirmation-modal email-change-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-change-title"
      >
        <header className="email-change-modal-header">
          <div>
            <h2 id="email-change-title">Acesso da conta</h2>
            <p>Altere seu e-mail ou redefina sua senha.</p>
          </div>
          <button className="icon-button" type="button" aria-label="Fechar" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </button>
        </header>

        <form action={action} className="email-change-form">
          <input type="hidden" name="groupId" value={groupId} />
          <label>
            E-mail atual
            <input type="email" value={currentEmail} readOnly />
          </label>
          <label>
            Novo e-mail
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="voce@exemplo.com"
              aria-describedby="email-change-note"
            />
          </label>
          <p id="email-change-note" className="field-hint">
            Enviaremos uma confirmação para o novo endereço. O e-mail atual continua funcionando até você confirmar.
          </p>
          {state?.error && <p className="form-error" role="alert">{state.error}</p>}
          {state?.success && <p className="form-success" role="status">{state.success}</p>}
          <div className="email-change-modal-actions">
            <button type="submit" disabled={pending}>
              {pending ? "Enviando…" : "Enviar confirmação"}
            </button>
            <Link className="secondary" href="/esqueci-senha">Alterar senha</Link>
          </div>
        </form>
      </section>
    </div>
  );
}

export function EmailChangeDialog({
  groupId,
  currentEmail,
}: {
  groupId: string;
  currentEmail: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="icon-button email-change-open-button"
        type="button"
        aria-label="Alterar e-mail ou senha"
        title="Clique para alterar o e-mail ou a senha"
        onClick={() => setOpen(true)}
      >
        <FontAwesomeIcon icon={faPenToSquare} aria-hidden="true" />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <EmailChangeForm
          key="email-change-form"
          groupId={groupId}
          currentEmail={currentEmail}
          onClose={() => setOpen(false)}
        />,
        document.body,
      )}
    </>
  );
}
