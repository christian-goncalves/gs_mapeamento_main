"use client";

import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { InputHTMLAttributes } from "react";
import { useState } from "react";

type PasswordVisibilityInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  secretLabel?: string;
};

export function PasswordVisibilityInput({
  secretLabel = "senha",
  ...inputProps
}: PasswordVisibilityInputProps) {
  const [visible, setVisible] = useState(false);
  const actionLabel = visible ? `Ocultar ${secretLabel}` : `Mostrar ${secretLabel}`;

  return (
    <div className="password-input-wrap">
      <input {...inputProps} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="icon-button password-visibility-toggle"
        aria-label={actionLabel}
        aria-pressed={visible}
        title={actionLabel}
        onClick={() => setVisible((current) => !current)}
      >
        <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} />
      </button>
    </div>
  );
}
