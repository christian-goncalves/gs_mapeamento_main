"use client";

import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export function CopyableLink({
  value,
  displayValue,
  label,
}: {
  value: string;
  displayValue: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="copy-field">
      <label htmlFor="link-formulario-ata">{label}</label>
      <div className="copy-row">
        <input id="link-formulario-ata" readOnly value={displayValue} />
        <button
          type="button"
          className="icon-button"
          aria-label="Copiar link de preenchimento"
          title="Copiar link"
          onClick={copy}
        >
          <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
        </button>
      </div>
      <span className="field-hint" aria-live="polite">
        {copied ? "Copiado" : " "}
      </span>
    </div>
  );
}
