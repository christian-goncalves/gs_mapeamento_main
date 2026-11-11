import type { GrupoServidorMesa } from "@/domain/entities";

export const MESA_SERVER_CLOSURE_PERSONALIZED = "Personalizado" as const;
export const MESA_SERVER_CLOSURE_LEGACY_OTHER = "Outro" as const;
export const MESA_SERVER_CLOSURE_DETAILS = ["Volta ao uso"] as const;

export const MESA_SERVER_CLOSURE_MOTIVES = [
  "Encerramento do Termo",
  "Entrega do Encargo",
  "Destituição",
  ...MESA_SERVER_CLOSURE_DETAILS,
  MESA_SERVER_CLOSURE_PERSONALIZED,
] as const;

export function mesaServerClosureDetailOptions(
  servidores: readonly Pick<GrupoServidorMesa, "motivo_encerramento" | "motivo_encerramento_detalhe">[],
) {
  const details = new Map<string, string>();

  for (const detail of MESA_SERVER_CLOSURE_DETAILS) {
    details.set(detail.toLocaleLowerCase("pt-BR"), detail);
  }

  for (const servidor of servidores) {
    if (
      servidor.motivo_encerramento !== MESA_SERVER_CLOSURE_PERSONALIZED &&
      servidor.motivo_encerramento !== MESA_SERVER_CLOSURE_LEGACY_OTHER
    ) {
      continue;
    }
    const detail = servidor.motivo_encerramento_detalhe?.trim();
    if (detail) details.set(detail.toLocaleLowerCase("pt-BR"), detail);
  }

  return [...details.values()].sort((first, second) =>
    first.localeCompare(second, "pt-BR"),
  );
}
