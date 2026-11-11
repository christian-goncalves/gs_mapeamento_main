"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faPaperPlane, faXmark } from "@fortawesome/free-solid-svg-icons";

export type PdfEmailRequest = {
  recipient: string;
  requestId: string;
};

export function PdfEmailDialog({
  open,
  title,
  subtitle,
  summaryTitle,
  summaryDescription,
  defaultRecipient,
  onClose,
  onSend,
  portal = false,
  className = "",
}: {
  open: boolean;
  title: string;
  subtitle: string;
  summaryTitle: string;
  summaryDescription: string;
  defaultRecipient: string;
  onClose: () => void;
  onSend: (request: PdfEmailRequest) => Promise<string | void>;
  portal?: boolean;
  className?: string;
}) {
  const titleId = useId();
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [requestId, setRequestId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const pendingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  pendingRef.current = pending;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    setRecipient(defaultRecipient);
    setRequestId(globalThis.crypto.randomUUID());
    setError("");
    setSuccess("");

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pendingRef.current) onCloseRef.current();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, defaultRecipient]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      setSuccess(await onSend({ recipient, requestId }) ?? "PDF enviado por e-mail.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar o PDF.");
    } finally {
      setPending(false);
    }
  }

  if (!open) return null;

  const dialog = (
    <div className="modal-backdrop pdf-email-modal-backdrop" role="presentation">
      <section
        className={`confirmation-modal ata-email-modal pdf-email-dialog ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="ata-email-modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            <p>{subtitle}</p>
          </div>
        </header>

        <form onSubmit={send}>
          <div className="ata-email-summary">
            <FontAwesomeIcon icon={faFilePdf} aria-hidden="true" />
            <div><strong>{summaryTitle}</strong><span>{summaryDescription}</span></div>
          </div>
          <label className="ata-email-field">
            <span>Destinatário</span>
            <input
              type="email"
              value={recipient}
              onChange={(event) => {
                setRecipient(event.target.value);
                setRequestId(globalThis.crypto.randomUUID());
              }}
              placeholder="nome@exemplo.com"
              autoComplete="email"
              autoFocus
              required
              disabled={pending || Boolean(success)}
            />
          </label>
          <p className="field-hint">Confira o endereço antes de confirmar o envio.</p>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {success ? <p className="admin-status-feedback" role="status">{success}</p> : null}
          <div className="modal-actions">
            {!success ? (
              <button type="submit" disabled={pending || !recipient.trim()}>
                <FontAwesomeIcon icon={faPaperPlane} />
                <span>{pending ? "Enviando..." : "Confirmar Envio"}</span>
              </button>
            ) : null}
            <button type="button" className="secondary" onClick={onClose} disabled={pending}>
              <FontAwesomeIcon icon={faXmark} />
              <span>{success ? "Fechar" : "Cancelar"}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );

  return portal && typeof document !== "undefined" ? createPortal(dialog, document.body) : dialog;
}
