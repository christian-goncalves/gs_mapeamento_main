"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faEnvelope, faEye, faFilePdf, faXmark } from "@fortawesome/free-solid-svg-icons";
import { PdfEmailDialog, type PdfEmailRequest } from "../pdf-email-dialog";

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
  const query = new URLSearchParams({ grupo: groupId, mes: month, ano: year });
  const previewUrl = `/api/relatorios/mensal/pdf?${query.toString()}`;
  const downloadQuery = new URLSearchParams(query);
  downloadQuery.set("download", "1");
  const [openEmail, setOpenEmail] = useState(false);
  const [openPdf, setOpenPdf] = useState(false);

  function showEmailDialog() {
    setOpenEmail(true);
  }

  async function sendReportEmail({ recipient, requestId }: PdfEmailRequest) {
    const response = await fetch("/api/relatorios/mensal/pdf", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ grupo: groupId, mes: month, ano: year, recipient, requestId }),
    });
    const body = await response.json().catch(() => null) as { error?: string; message?: string } | null;
    if (!response.ok) throw new Error(body?.error ?? "Não foi possível enviar o PDF.");
    return body?.message ?? "Relatório mensal enviado por e-mail.";
  }

  return (
    <>
      <button
        type="button"
        className="dashboard-pdf-button"
        aria-label="Opções do PDF mensal"
        title="Opções do PDF"
        onClick={() => setOpenPdf(true)}
      >
        <FontAwesomeIcon icon={faFilePdf} aria-hidden="true" />
      </button>
      <button type="button" className="dashboard-email-button" aria-label="Enviar por e-mail" title="Enviar por e-mail" onClick={showEmailDialog}>
        <FontAwesomeIcon icon={faEnvelope} />
      </button>
      {openPdf ? (
        <div className="modal-backdrop pdf-email-modal-backdrop" role="presentation">
          <section className="confirmation-modal ata-email-modal monthly-report-pdf-modal" role="dialog" aria-modal="true" aria-labelledby="monthly-report-pdf-title">
            <header className="ata-email-modal-header">
              <div><h2 id="monthly-report-pdf-title">Relatório mensal em PDF</h2><p>{groupName} · {month}/{year}</p></div>
            </header>
            <div className="ata-email-summary">
              <FontAwesomeIcon icon={faFilePdf} aria-hidden="true" />
              <div><strong>Escolha uma opção</strong><span>Visualize o relatório ou baixe o arquivo PDF.</span></div>
            </div>
            <div className="modal-actions monthly-report-pdf-actions">
              <a href={previewUrl} target="_blank" rel="noreferrer" className="monthly-report-pdf-primary">
                <FontAwesomeIcon icon={faEye} /><span>Visualizar</span>
              </a>
              <a href={`/api/relatorios/mensal/pdf?${downloadQuery.toString()}`} className="secondary">
                <FontAwesomeIcon icon={faDownload} /><span>Baixar</span>
              </a>
              <button type="button" className="secondary" onClick={() => setOpenPdf(false)}>
                <FontAwesomeIcon icon={faXmark} /><span>Cancelar</span>
              </button>
            </div>
          </section>
        </div>
      ) : null}
      <PdfEmailDialog
        open={openEmail}
        title="Enviar relatório mensal"
        subtitle={`${groupName} · ${month}/${year}`}
        summaryTitle="Relatório mensal em PDF"
        summaryDescription="O período selecionado será enviado como anexo."
        defaultRecipient={defaultRecipient}
        onClose={() => setOpenEmail(false)}
        onSend={sendReportEmail}
        portal
        className="monthly-report-email-modal"
      />
    </>
  );
}
