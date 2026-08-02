"use client";

import { useEffect, useId, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faFilePdf, faPaperPlane, faXmark } from "@fortawesome/free-solid-svg-icons";

export function AtaPdfActions({
  ataId,
  title,
  filename,
  defaultRecipient,
  showPreview = true,
  iconOnly = false,
}: {
  ataId: string;
  title: string;
  filename: string;
  defaultRecipient: string;
  showPreview?: boolean;
  iconOnly?: boolean;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requestId, setRequestId] = useState("");

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, pending]);

  function openEmailDialog() {
    setRecipient(defaultRecipient);
    setError("");
    setSuccess("");
    setRequestId(globalThis.crypto.randomUUID());
    setOpen(true);
  }

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/atas/${ataId}/pdf/email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipient,
          requestId,
        }),
      });
      const body = await response.json().catch(() => null) as { error?: string; message?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "Não foi possível enviar o PDF.");
      setSuccess(body?.message ?? "PDF enviado por e-mail.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar o PDF.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {showPreview && (
        <a
          className="button-link secondary review-pdf-button"
          href={`/atas/${ataId}/pdf`}
          target="_blank"
          rel="noreferrer"
        >
          <FontAwesomeIcon icon={faFilePdf} />
          <span>Visualizar PDF</span>
        </a>
      )}
      <button
        type="button"
        className={`button-link secondary review-email-button${iconOnly ? " ata-pdf-icon-button" : ""}`}
        onClick={openEmailDialog}
        title={iconOnly ? "Enviar por e-mail" : undefined}
        aria-label={iconOnly ? "Enviar por e-mail" : undefined}
      >
        <FontAwesomeIcon icon={faEnvelope} />
        {!iconOnly && <span>Enviar por e-mail</span>}
      </button>

      {open && (
        <div className="modal-backdrop ata-email-modal-backdrop" role="presentation">
          <section
            className="confirmation-modal ata-email-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <header className="ata-email-modal-header">
              <div>
                <h2 id={titleId}>Enviar PDF por e-mail</h2>
                <p>{title}</p>
              </div>
              <button
                type="button"
                className="message-close"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </header>

            <form onSubmit={send}>
              <div className="ata-email-summary">
                <FontAwesomeIcon icon={faFilePdf} aria-hidden="true" />
                <div><strong>{filename}</strong><span>O PDF confirmado será enviado como anexo.</span></div>
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
              {error && <p className="form-error" role="alert">{error}</p>}
              {success && <p className="admin-status-feedback" role="status">{success}</p>}
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setOpen(false)} disabled={pending}>
                  {success ? "Fechar" : "Cancelar"}
                </button>
                {!success && (
                  <button type="submit" disabled={pending || !recipient.trim()}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                    <span>{pending ? "Enviando..." : "Confirmar envio"}</span>
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
