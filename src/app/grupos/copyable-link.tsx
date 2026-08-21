"use client";

import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactNode } from "react";
import { useId, useState } from "react";

export function CopyableLink({
  value,
  displayValue,
  label,
  trailingAction,
}: {
  value: string;
  displayValue: string;
  label: string;
  trailingAction?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const inputId = useId();

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="copy-field">
      <label htmlFor={inputId}>{label}</label>
      <div className={trailingAction ? "copy-row copy-row-actions" : "copy-row"}>
        <input id={inputId} readOnly value={displayValue} />
        <button
          type="button"
          className="icon-button"
          aria-label={`Copiar ${label.toLocaleLowerCase("pt-BR")}`}
          title="Copiar link"
          onClick={copy}
        >
          <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
        </button>
        {trailingAction}
      </div>
      <span className="field-hint" aria-live="polite">
        {copied ? "Copiado" : " "}
      </span>
    </div>
  );
}
