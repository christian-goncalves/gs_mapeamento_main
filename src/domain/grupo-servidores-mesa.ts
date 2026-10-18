import type { GrupoServidorMesa } from "./schemas";

export const KNOWN_MESA_OFFICES = [
  "RSG",
  "RSG suplente",
  "Secretário",
  "Tesoureiro",
] as const;

export type KnownMesaOffice = (typeof KNOWN_MESA_OFFICES)[number];

export function normalizeMesaName(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized || "vago";
}

export function isVacantMesaName(value: string) {
  return normalizeMesaName(value).toLocaleLowerCase("pt-BR") === "vago";
}

export function activeMesaServersForGroup(
  servidores: readonly GrupoServidorMesa[],
  grupoId: string,
) {
  return servidores
    .filter((item) => item.grupo_id === grupoId && item.ativo)
    .sort(
      (first, second) =>
        first.ordem - second.ordem ||
        first.encargo.localeCompare(second.encargo, "pt-BR"),
    );
}
