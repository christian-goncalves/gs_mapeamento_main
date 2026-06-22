"use client";

import { useEffect, useState } from "react";

type Suggestion = { id: number; nome: string; uf: string; label: string };

export function MunicipioAutocomplete({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value.trim().length < 2) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/municipios?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Busca indisponível.");
        const data = (await response.json()) as { municipios: Suggestion[] };
        setSuggestions(data.municipios);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  const visibleSuggestions =
    value.trim().length >= 2 ? suggestions : [];

  return (
    <div className="autocomplete">
      <input
        id={id}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visibleSuggestions.length > 0}
        aria-controls={`${id}-options`}
        placeholder="Digite nome ou UF"
      />
      {value.trim().length >= 2 && loading && (
        <span className="field-hint">Buscando...</span>
      )}
      {visibleSuggestions.length > 0 && (
        <ul id={`${id}-options`} className="autocomplete-options" role="listbox">
          {visibleSuggestions.map((suggestion) => (
            <li key={suggestion.id} role="option" aria-selected={value === suggestion.label}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(suggestion.label);
                  setSuggestions([]);
                }}
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
