"use client";

import { useState } from "react";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function filterTextSuggestions(
  suggestions: string[],
  value: string,
  limit = 8,
) {
  const normalizedValue = normalize(value);
  return suggestions
    .filter(
      (suggestion) =>
        !normalizedValue || normalize(suggestion).startsWith(normalizedValue),
    )
    .slice(0, limit);
}

export function TextAutocomplete({
  id,
  ariaLabel,
  required,
  value,
  placeholder,
  suggestions,
  onChange,
}: {
  id?: string;
  ariaLabel?: string;
  required?: boolean;
  value: string;
  placeholder?: string;
  suggestions: string[];
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const visibleSuggestions = focused
    ? filterTextSuggestions(suggestions, value)
    : [];

  return (
    <div className="autocomplete">
      <input
        id={id}
        aria-label={ariaLabel}
        type="text"
        required={required}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visibleSuggestions.length > 0}
        aria-controls={id ? `${id}-options` : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => onChange(event.target.value)}
      />
      {visibleSuggestions.length > 0 && (
        <ul
          id={id ? `${id}-options` : undefined}
          className="autocomplete-options"
          role="listbox"
        >
          {visibleSuggestions.map((suggestion) => (
            <li key={suggestion} role="option" aria-selected={value === suggestion}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(suggestion);
                  setFocused(false);
                }}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
