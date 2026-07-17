"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  faCirclePlay,
  faClone,
  faEye,
  faPenToSquare,
  faPowerOff,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  activateGrupoAction,
  deactivateGrupoAction,
  duplicateGrupoAction,
} from "./actions";

function StatusSubmitButton({
  ativo,
  grupoNome,
}: {
  ativo: boolean;
  grupoNome: string;
}) {
  const { pending } = useFormStatus();
  const label = ativo ? `Inativar ${grupoNome}` : `Ativar ${grupoNome}`;

  return (
    <button
      type="submit"
      className={ativo ? "danger-icon-button" : "activate-icon-button"}
      aria-label={label}
      title={ativo ? "Inativar" : "Ativar"}
      disabled={pending}
    >
      <FontAwesomeIcon icon={ativo ? faPowerOff : faCirclePlay} />
    </button>
  );
}

export function GroupListActions({
  grupoId,
  grupoNome,
  ativo = true,
}: {
  grupoId: string;
  grupoNome: string;
  ativo?: boolean;
}) {
  return (
    <div className="row-actions group-list-actions">
      <Link
        className="icon-button"
        href={`/grupos/${grupoId}`}
        aria-label={`Visualizar ${grupoNome}`}
        title="Visualizar"
      >
        <FontAwesomeIcon icon={faEye} />
      </Link>
      <Link
        className="icon-button"
        href={`/grupos/${grupoId}`}
        aria-label={`Editar ${grupoNome}`}
        title="Editar"
      >
        <FontAwesomeIcon icon={faPenToSquare} />
      </Link>
      <form action={duplicateGrupoAction}>
        <input type="hidden" name="grupo_id" value={grupoId} />
        <button
          type="submit"
          className="icon-button"
          aria-label={`Duplicar ${grupoNome}`}
          title="Duplicar"
        >
          <FontAwesomeIcon icon={faClone} />
        </button>
      </form>
      <form
        action={ativo ? deactivateGrupoAction : activateGrupoAction}
        onSubmit={(event) => {
          const message = ativo
            ? `Inativar ${grupoNome}? O grupo deixará de aparecer como ativo.`
            : `Ativar ${grupoNome}? O grupo voltará a aparecer como ativo.`;
          if (!window.confirm(message)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="grupo_id" value={grupoId} />
        <StatusSubmitButton ativo={ativo} grupoNome={grupoNome} />
      </form>
    </div>
  );
}
