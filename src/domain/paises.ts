export type Pais = {
  codigo: string;
  codigo_iso3: string;
  nome: string;
};

export type PaisesCache = {
  version: 1;
  updatedAt: string | null;
  countries: Pais[];
};

export function normalizeCountryName(value: string) {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function normalizeCountries(countries: Pais[]) {
  const seen = new Set<string>();
  return countries
    .map((country) => ({
      codigo: country.codigo.trim().toUpperCase(),
      codigo_iso3: country.codigo_iso3.trim().toUpperCase(),
      nome: country.nome.trim(),
    }))
    .filter((country) => country.codigo && country.codigo_iso3 && country.nome)
    .filter((country) => {
      const key = country.codigo || normalizeCountryName(country.nome);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((first, second) => first.nome.localeCompare(second.nome, "pt-BR"));
}
