"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { nextAutocompleteIndex, selectedAutocompleteIndex } from "./text-autocomplete";

type Suggestion = { id: number; nome: string; uf: string; label: string };

export function MunicipioAutocomplete({
  id,
  ariaLabel,
  placeholder = "Digite nome ou UF",
  value,
  onChange,
}: {
  id: string;
  ariaLabel?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

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
    focused && value.trim().length >= 2 ? suggestions : [];

  function selectSuggestion(index: number) {
    const suggestion = visibleSuggestions[index];
    if (!suggestion) return;
    onChange(suggestion.label);
    setSuggestions([]);
    setFocused(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (visibleSuggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => nextAutocompleteIndex(current, "ArrowDown", visibleSuggestions.length));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => nextAutocompleteIndex(current, "ArrowUp", visibleSuggestions.length));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      selectSuggestion(selectedAutocompleteIndex(activeIndex, visibleSuggestions.length));
      return;
    }
    if (event.key === "Tab") {
      selectSuggestion(selectedAutocompleteIndex(activeIndex, visibleSuggestions.length));
    }
  }

  return (
    <div className="autocomplete">
      <input
        id={id}
        aria-label={ariaLabel}
        required
        value={value}
        onChange={(event) => {
          setActiveIndex(-1);
          onChange(event.target.value);
        }}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visibleSuggestions.length > 0}
        aria-controls={`${id}-options`}
        aria-activedescendant={
          activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        placeholder={placeholder}
        onFocus={() => {
          setActiveIndex(-1);
          setFocused(true);
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
      />
      {value.trim().length >= 2 && loading && (
        <span className="field-hint">Buscando...</span>
      )}
      {visibleSuggestions.length > 0 && (
        <ul id={`${id}-options`} className="autocomplete-options" role="listbox">
          {visibleSuggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={activeIndex === index || value === suggestion.label}
              className={activeIndex === index ? "is-active" : undefined}
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(index)}
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
