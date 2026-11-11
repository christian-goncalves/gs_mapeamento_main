"use client";

import { useId, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faEnvelope, faEye, faFilePdf, faXmark } from "@fortawesome/free-solid-svg-icons";
import { PdfEmailDialog } from "../pdf-email-dialog";

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
  const [openEmail, setOpenEmail] = useState(false);
  const [openPdf, setOpenPdf] = useState(false);

  function openEmailDialog() {
    setOpenEmail(true);
  }

  async function sendPdfEmail({ recipient, requestId }: { recipient: string; requestId: string }) {
    const response = await fetch(`/api/atas/${ataId}/pdf/email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recipient, requestId }),
    });
    const body = await response.json().catch(() => null) as { error?: string; message?: string } | null;
    if (!response.ok) throw new Error(body?.error ?? "Não foi possível enviar o PDF.");
    return body?.message ?? "PDF enviado por e-mail.";
  }

  return (
    <>
      {showPreview && (
        <button
          type="button"
          className={`button-link secondary review-pdf-button${iconOnly ? " ata-pdf-icon-button" : ""}`}
          onClick={() => setOpenPdf(true)}
          title={iconOnly ? "Opções do PDF" : undefined}
          aria-label={iconOnly ? "Opções do PDF" : undefined}
        >
          <FontAwesomeIcon icon={faFilePdf} />
          {!iconOnly && <span>Visualizar PDF</span>}
        </button>
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

      {openPdf && (
        <div className="modal-backdrop pdf-email-modal-backdrop" role="presentation">
          <section className="confirmation-modal ata-email-modal monthly-report-pdf-modal ata-pdf-choice-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <header className="ata-email-modal-header">
              <div><h2 id={titleId}>PDF da ata</h2><p>{title}</p></div>
            </header>
            <div className="ata-email-summary">
              <FontAwesomeIcon icon={faFilePdf} aria-hidden="true" />
              <div><strong>{filename}</strong><span>Escolha visualizar o PDF ou baixar o arquivo.</span></div>
            </div>
            <div className="modal-actions monthly-report-pdf-actions">
              <a href={`/atas/${ataId}/pdf`} target="_blank" rel="noreferrer" className="monthly-report-pdf-primary" onClick={() => setOpenPdf(false)}>
                <FontAwesomeIcon icon={faEye} /><span>Visualizar</span>
              </a>
              <a href={`/api/atas/${ataId}/pdf?download=1`} className="secondary" onClick={() => setOpenPdf(false)}>
                <FontAwesomeIcon icon={faDownload} /><span>Baixar</span>
              </a>
              <button type="button" className="secondary" onClick={() => setOpenPdf(false)}>
                <FontAwesomeIcon icon={faXmark} /><span>Cancelar</span>
              </button>
            </div>
          </section>
        </div>
      )}

      <PdfEmailDialog
        open={openEmail}
        title="Enviar PDF por e-mail"
        subtitle={title}
        summaryTitle={filename}
        summaryDescription="O PDF confirmado será enviado como anexo."
        defaultRecipient={defaultRecipient}
        onClose={() => setOpenEmail(false)}
        onSend={sendPdfEmail}
      />
    </>
  );
}
