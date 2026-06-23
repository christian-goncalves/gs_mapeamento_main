export const SHEET_HEADERS = {
  grupos: [
    "grupo_id", "zoom_id", "grupo_nome", "ordem", "ativo", "created_at", "updated_at",
  ],
  atas: [
    "ata_id", "grupo_id", "data_reuniao", "hora_inicio", "plataforma", "tipo_reuniao",
    "formato_partilha", "formato_estudo", "formato_tematico", "formato_literatura",
    "formato_passos", "formato_tradicoes", "total_membros_presentes", "total_partilhas", "created_at", "updated_at",
  ],
  servidores: ["servidor_id", "ata_id", "nome", "ordem", "created_at", "updated_at"],
  participacao: ["participacao_id", "ata_id", "localidade", "estado", "pais", "presencas", "created_at", "updated_at"],
  visitantes: ["visitante_id", "ata_id", "nome", "cidade", "categoria", "origem_contato", "created_at", "updated_at"],
  ingressos: ["ingresso_id", "ata_id", "nome", "created_at", "updated_at"],
  trocas_chaveiro: ["troca_chaveiro_id", "ata_id", "tempo_limpo", "quantidade", "created_at", "updated_at"],
} as const;

export type SheetName = keyof typeof SHEET_HEADERS;
