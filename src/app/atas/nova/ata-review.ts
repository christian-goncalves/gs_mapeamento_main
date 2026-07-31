export function formatReviewDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function getReviewMetricCounts(
  draft: {
    servidores: unknown[];
    participacao: unknown[];
    membros_internacionais: unknown[];
    visitantes: unknown[];
    ingressos: unknown[];
  },
  conquistasTempo: number,
) {
  return {
    servidores: draft.servidores.length,
    localidades: draft.participacao.length,
    membrosInternacionais: draft.membros_internacionais.length,
    visitantes: draft.visitantes.length,
    ingressos: draft.ingressos.length,
    conquistasTempo,
  };
}
