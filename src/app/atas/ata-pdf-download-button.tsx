"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";

export function AtaPdfDownloadButton({
  ataId,
  className = "responsavel-action-menu-item",
  compact = false,
  onComplete,
}: {
  ataId: string;
  className?: string;
  compact?: boolean;
  onComplete?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/atas/${ataId}/pdf`);
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error ?? "Não foi possível gerar o PDF.");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? `ata-${ataId}.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      onComplete?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o PDF.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={compact ? "ata-pdf-action-compact" : "ata-pdf-action"}>
      <button
        type="button"
        className={className}
        onClick={download}
        disabled={pending}
        role={compact ? "menuitem" : undefined}
      >
        <FontAwesomeIcon icon={faFilePdf} />
        <span>{pending ? "Gerando PDF..." : "Gerar PDF"}</span>
      </button>
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}
