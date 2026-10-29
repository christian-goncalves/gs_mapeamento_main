export const SERVER_FUNCTION_MAX_LENGTH = 80;

export class GroupFunctionCatalogUnavailableError extends Error {
  constructor() {
    super(
      "O cadastro de funções personalizadas do grupo ainda não está disponível. Provisione a aba grupo_funcoes_servidor antes de enviar a ata.",
    );
    this.name = "GroupFunctionCatalogUnavailableError";
  }
}

export function normalizeServerFunctionName(value: string) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return `${trimmed.slice(0, 1).toLocaleUpperCase("pt-BR")}${trimmed.slice(1)}`;
}

export function serverFunctionComparisonKey(value: string) {
  return normalizeServerFunctionName(value).toLocaleLowerCase("pt-BR");
}
