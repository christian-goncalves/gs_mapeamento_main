"use client";

import Link from "next/link";
import {
  faClone,
  faPenToSquare,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { deleteGrupoAction, duplicateGrupoAction } from "./actions";

export function GroupListActions({
  grupoId,
  grupoNome,
}: {
  grupoId: string;
  grupoNome: string;
}) {
  return (
    <div className="row-actions group-list-actions">
      <Link
        className="icon-button"
        href={`/grupos/${grupoId}`}
        aria-label={`Editar ${grupoNome}`}
        title="Editar"
      >
        <FontAwesomeIcon icon={faPenToSquare} />
      </Link>
      <form
        action={deleteGrupoAction}
        onSubmit={(event) => {
          if (!window.confirm(`Excluir ${grupoNome}? O grupo será marcado como inativo.`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="grupo_id" value={grupoId} />
        <button
          type="submit"
          className="danger-icon-button"
          aria-label={`Excluir ${grupoNome}`}
          title="Excluir"
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      </form>
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
    </div>
  );
}
