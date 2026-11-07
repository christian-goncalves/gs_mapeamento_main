"use client";

import { useState, type KeyboardEvent } from "react";

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

export function nextAutocompleteIndex(
  current: number,
  key: "ArrowDown" | "ArrowUp",
  length: number,
) {
  if (length === 0) return -1;
  if (key === "ArrowDown") return ((current + 1) % length + length) % length;
  return current <= 0 ? length - 1 : (current - 1) % length;
}

export function selectedAutocompleteIndex(activeIndex: number, length: number) {
  if (length === 0) return -1;
  return activeIndex >= 0 && activeIndex < length ? activeIndex : 0;
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const visibleSuggestions = focused
    ? filterTextSuggestions(suggestions, value)
    : [];

  function selectSuggestion(index: number) {
    const suggestion = visibleSuggestions[index];
    if (!suggestion) return;
    onChange(suggestion);
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
        type="text"
        required={required}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visibleSuggestions.length > 0}
        aria-controls={id ? `${id}-options` : undefined}
        aria-activedescendant={
          activeIndex >= 0 && id ? `${id}-option-${activeIndex}` : undefined
        }
        onFocus={() => {
          setActiveIndex(-1);
          setFocused(true);
        }}
        onBlur={() => setFocused(false)}
        onChange={(event) => {
          setActiveIndex(-1);
          onChange(event.target.value);
        }}
        onKeyDown={handleKeyDown}
      />
      {visibleSuggestions.length > 0 && (
        <ul
          id={id ? `${id}-options` : undefined}
          className="autocomplete-options"
          role="listbox"
        >
          {visibleSuggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              id={id ? `${id}-option-${index}` : undefined}
              role="option"
              aria-selected={activeIndex === index || value === suggestion}
              className={activeIndex === index ? "is-active" : undefined}
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(index)}
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
