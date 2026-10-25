"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark, faFileCirclePlus } from "@fortawesome/free-solid-svg-icons";

export function PublicAtaConfirmationActions({ link }: { link: string }) {
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return (
      <p className="public-ata-declined-message" role="status">
        Tudo certo. Nenhuma outra ata será registrada.
      </p>
    );
  }

  return (
    <div className="public-ata-confirmation-actions">
      <Link className="button-link" href={`/preencher/${link}`}>
        <FontAwesomeIcon icon={faFileCirclePlus} aria-hidden="true" />
        <span>Registrar outra Ata</span>
      </Link>
      <button
        className="public-ata-decline-button"
        type="button"
        onClick={() => setDeclined(true)}
      >
        <FontAwesomeIcon icon={faCircleXmark} aria-hidden="true" />
        <span>Não registrar</span>
      </button>
    </div>
  );
}
