"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faShareNodes } from "@fortawesome/free-solid-svg-icons";

type ShareNavigator = Navigator & {
  canShare?: (data?: ShareData) => boolean;
  share?: (data?: ShareData) => Promise<void>;
};

function responseFilename(response: Response, fallback: string) {
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i);
  if (!match) return fallback;
  try {
    return decodeURIComponent(match[1].replace(/"/g, "").trim());
  } catch {
    return match[1].replace(/"/g, "").trim() || fallback;
  }
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("A cópia automática não está disponível neste navegador.");
}

export function PdfShareActions({
  fileUrl,
  shortPath,
  filename,
  title,
}: {
  fileUrl: string;
  shortPath: string;
  filename: string;
  title: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    fetch(fileUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok || !response.headers.get("content-type")?.includes("application/pdf")) {
          throw new Error("Não foi possível preparar o PDF.");
        }
        const blob = await response.blob();
        return new File([blob], responseFilename(response, filename), { type: "application/pdf" });
      })
      .then((preparedFile) => {
        if (active) setFile(preparedFile);
      })
      .catch(() => {
        if (active) setFileError(true);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [fileUrl, filename]);

  async function shareShortLink() {
    const url = new URL(shortPath, window.location.origin).toString();
    const shareNavigator = navigator as ShareNavigator;
    setStatus("Este navegador compartilhará o link curto, não o arquivo PDF.");
    if (shareNavigator.share) {
      try {
        await shareNavigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await copyText(url);
      setStatus("O link curto foi copiado. Você pode colá-lo na conversa.");
    } catch {
      setStatus("Não foi possível compartilhar ou copiar automaticamente. Use Baixar ou copie o endereço do link curto.");
    }
  }

  async function sharePdf() {
    setStatus("");
    const shareNavigator = navigator as ShareNavigator;
    if (!file || !shareNavigator.share || !shareNavigator.canShare?.({ files: [file] })) {
      await shareShortLink();
      return;
    }
    try {
      await shareNavigator.share({ files: [file], title });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await shareShortLink();
    }
  }

  return (
    <div className="pdf-share-button-wrap">
      <button type="button" className="secondary" disabled={!file && !fileError} onClick={sharePdf}>
        <FontAwesomeIcon icon={faShareNodes} aria-hidden="true" /><span>Compartilhar</span>
      </button>
      <span className="pdf-share-status" role="status" aria-live="polite">
        {status || (fileError ? "O PDF será compartilhado pelo link curto neste navegador." : file ? "" : "Preparando o PDF para compartilhar…")}
      </span>
    </div>
  );
}

export function PdfCopyLinkAction({ shortPath }: { shortPath: string }) {
  const [status, setStatus] = useState("");

  async function copyShortLink() {
    try {
      await copyText(new URL(shortPath, window.location.origin).toString());
      setStatus("Link curto copiado.");
    } catch {
      setStatus("Não foi possível copiar o link automaticamente neste navegador.");
    }
  }

  return (
    <div className="pdf-copy-link-actions">
      <button type="button" className="pdf-short-link-action" onClick={copyShortLink}>
        <FontAwesomeIcon icon={faLink} aria-hidden="true" /><span>Copiar link curto</span>
      </button>
      <span role="status" aria-live="polite">{status}</span>
    </div>
  );
}
