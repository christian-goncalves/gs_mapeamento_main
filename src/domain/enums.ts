export function createEnumMapping<const T extends Record<string, string>>(
  labels: T,
) {
  const codes = Object.keys(labels) as (keyof T)[];
  const reverse = new Map(
    Object.entries(labels).map(([code, label]) => [label, code]),
  );

  return {
    codes,
    labels: Object.values(labels),
    toSheet(code: keyof T) {
      return labels[code];
    },
    fromSheet(label: string) {
      const code = reverse.get(label);
      if (!code) throw new Error(`Rotulo desconhecido no Sheets: ${label}`);
      return code as keyof T;
    },
  };
}

export const plataformaMapping = createEnumMapping({ zoom: "Zoom" } as const);

export const tipoReuniaoMapping = createEnumMapping({
  aberta: "Aberta",
  fechada: "Fechada",
} as const);

export const categoriaVisitanteMapping = createEnumMapping({
  provavel_adicto: "Provável adicto",
  familiar: "Familiar",
  profissional: "Profissional",
  estudante: "Estudante",
  outro: "Outro",
} as const);

export const origemContatoMapping = createEnumMapping({
  indicacao_pessoal: "Indicação pessoal",
  familiar: "Familiar",
  profissional: "Profissional",
  grupo_na: "Grupo de NA",
  internet: "Internet",
  redes_sociais: "Redes sociais",
  radio: "Rádio",
  tv: "TV",
  material_impresso: "Material impresso",
  evento_palestra: "Evento/Palestra",
  encaminhamento: "Encaminhamento",
  outro: "Outro",
} as const);

export const tempoLimpoMapping = createEnumMapping({
  "1M": "1M",
  "2M": "2M",
  "3M": "3M",
  "6M": "6M",
  "9M": "9M",
  "12M": "12M",
  "18M": "18M",
  MULTIPLOS_ANOS: "MULTIPLOS_ANOS",
} as const);

export const formatoMapping = createEnumMapping({
  partilha: "Partilha",
  estudo: "Estudo",
  tematico: "Temática",
  literatura: "Literatura",
  passos: "Passos",
  tradicoes: "Tradições",
  outros: "Outros",
} as const);

export type Plataforma = (typeof plataformaMapping.codes)[number];
export type TipoReuniao = (typeof tipoReuniaoMapping.codes)[number];
export type CategoriaVisitante =
  (typeof categoriaVisitanteMapping.codes)[number];
export type OrigemContato = (typeof origemContatoMapping.codes)[number];
export type TempoLimpo = (typeof tempoLimpoMapping.codes)[number];
export type Formato = (typeof formatoMapping.codes)[number];
