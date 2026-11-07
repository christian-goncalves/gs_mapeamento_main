"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faFilePdf, faPaperPlane, faPrint, faXmark } from "@fortawesome/free-solid-svg-icons";

export function MonthlyReportActions({
  groupId,
  month,
  year,
  groupName,
  defaultRecipient,
}: {
  groupId: string;
  month: string;
  year: string;
  groupName: string;
  defaultRecipient: string;
}) {
  const titleId = useId();
  const query = new URLSearchParams({ grupo: groupId, mes: month, ano: year });
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [requestId, setRequestId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function showDialog() {
    setRecipient(defaultRecipient);
    setRequestId(globalThis.crypto.randomUUID());
    setError("");
    setSuccess("");
    setOpen(true);
  }

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/relatorios/mensal/pdf", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grupo: groupId, mes: month, ano: year, recipient, requestId }),
      });
      const body = await response.json().catch(() => null) as { error?: string; message?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "Não foi possível enviar o PDF.");
      setSuccess(body?.message ?? "Relatório mensal enviado por e-mail.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar o PDF.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <a
        className="dashboard-pdf-button"
        aria-label="Baixar PDF"
        title="Baixar PDF"
        href={`/api/relatorios/mensal/pdf?${query.toString()}&download=1`}
      >
        <span className="button-content"><FontAwesomeIcon icon={faFilePdf} /><span className="dashboard-pdf-button-label">PDF</span></span>
      </a>
      <button type="button" className="dashboard-print-button" aria-label="Imprimir relatório" title="Imprimir relatório" onClick={() => window.print()}>
        <FontAwesomeIcon icon={faPrint} />
      </button>
      <button type="button" className="dashboard-email-button" aria-label="Enviar por e-mail" title="Enviar por e-mail" onClick={showDialog}>
        <FontAwesomeIcon icon={faEnvelope} />
      </button>
      {open && typeof document !== "undefined" ? createPortal((
        <div className="modal-backdrop ata-email-modal-backdrop" role="presentation">
          <section className="confirmation-modal ata-email-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <header className="ata-email-modal-header">
              <div><h2 id={titleId}>Enviar relatório mensal</h2><p>{groupName} · {month}/{year}</p></div>
              <button type="button" className="message-close" aria-label="Fechar" onClick={() => setOpen(false)} disabled={pending}><FontAwesomeIcon icon={faXmark} /></button>
            </header>
            <form onSubmit={send}>
              <div className="ata-email-summary"><FontAwesomeIcon icon={faFilePdf} aria-hidden="true" /><div><strong>Relatório mensal em PDF</strong><span>O período selecionado será enviado como anexo.</span></div></div>
              <label className="ata-email-field"><span>Destinatário</span><input type="email" value={recipient} onChange={(event) => { setRecipient(event.target.value); setRequestId(globalThis.crypto.randomUUID()); }} placeholder="nome@exemplo.com" autoComplete="email" autoFocus required disabled={pending || Boolean(success)} /></label>
              <p className="field-hint">Confira o endereço antes de confirmar o envio.</p>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              {success ? <p className="admin-status-feedback" role="status">{success}</p> : null}
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setOpen(false)} disabled={pending}>{success ? "Fechar" : "Cancelar"}</button>
                {!success ? <button type="submit" disabled={pending || !recipient.trim()}><FontAwesomeIcon icon={faPaperPlane} /><span>{pending ? "Enviando..." : "Confirmar envio"}</span></button> : null}
              </div>
            </form>
          </section>
        </div>
      ), document.body) : null}
    </>
  );
}
