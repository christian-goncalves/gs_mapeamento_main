import type { AggregatedAta } from "./aggregate";

function isActiveAta(item: AggregatedAta) {
  return (item.registro.ata.status_registro ?? "ativa") === "ativa";
}

/**
 * Calcula a numeração exibida das atas sem depender dos identificadores
 * legados persistidos em `atas`.
 */
export function deriveAtaNumbers(atas: readonly AggregatedAta[]) {
  const numbers = new Map<string, number>();
  const byGroup = new Map<string, AggregatedAta[]>();

  for (const item of atas) {
    if (!isActiveAta(item)) continue;
    const groupAtas = byGroup.get(item.grupo.grupo_id) ?? [];
    groupAtas.push(item);
    byGroup.set(item.grupo.grupo_id, groupAtas);
  }

  for (const groupAtas of byGroup.values()) {
    const ordered = [...groupAtas].sort(
      (first, second) => first.registro.ata.data_reuniao.localeCompare(second.registro.ata.data_reuniao)
        || first.registro.ata.hora_inicio.localeCompare(second.registro.ata.hora_inicio),
    );
    const offset = ordered[0]?.grupo.ultima_reuniao_anterior ?? 0;

    ordered.forEach((item, index) => {
      numbers.set(item.registro.ata.ata_id, offset + index + 1);
    });
  }

  return numbers;
}

export function deriveAtaNumber(
  atas: readonly AggregatedAta[],
  ataId: string,
) {
  return deriveAtaNumbers(atas).get(ataId) ?? null;
}
