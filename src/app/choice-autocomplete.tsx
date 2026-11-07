"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { nextAutocompleteIndex, selectedAutocompleteIndex } from "./atas/nova/text-autocomplete";

export type ChoiceOption = { value: string; label: string };

export function ChoiceAutocomplete({
  id,
  ariaLabel,
  required = false,
  value,
  options,
  placeholder = "Escolha...",
  name,
  className,
  toggleLabel = "opções",
  onChange,
}: {
  id: string;
  ariaLabel?: string;
  required?: boolean;
  value: string;
  options: ChoiceOption[];
  placeholder?: string;
  name?: string;
  className?: string;
  toggleLabel?: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const selectedOption = options.find((option) => option.value === value);
  const normalizedQuery = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
  const visibleOptions = focused
    ? options.filter((option) =>
        !normalizedQuery ||
        option.label
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLocaleLowerCase("pt-BR")
          .startsWith(normalizedQuery),
      )
    : [];

  function selectOption(index: number) {
    const option = visibleOptions[index];
    if (!option) return;
    onChange(option.value);
    setQuery("");
    setFocused(false);
    setActiveIndex(-1);
    window.requestAnimationFrame(() => inputRef.current?.select());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && focused) {
      event.preventDefault();
      setActiveIndex((current) => nextAutocompleteIndex(current, "ArrowDown", visibleOptions.length));
      return;
    }
    if (event.key === "ArrowUp" && focused) {
      event.preventDefault();
      setActiveIndex((current) => nextAutocompleteIndex(current, "ArrowUp", visibleOptions.length));
      return;
    }
    if (event.key === "Enter" && focused && visibleOptions.length > 0) {
      event.preventDefault();
      selectOption(selectedAutocompleteIndex(activeIndex, visibleOptions.length));
    }
  }

  return (
    <div className={`autocomplete autocomplete--choice${className ? ` ${className}` : ""}`}>
      {name && <input type="hidden" name={name} value={value} />}
      <input
        ref={inputRef}
        id={id}
        aria-label={ariaLabel}
        type="text"
        required={required && !selectedOption}
        value={focused ? query : selectedOption?.label ?? ""}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visibleOptions.length > 0}
        aria-controls={`${id}-options`}
        aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        onFocus={() => {
          setQuery("");
          setActiveIndex(-1);
          setFocused(true);
        }}
        onBlur={() => {
          setQuery("");
          setFocused(false);
          setActiveIndex(-1);
        }}
        onClick={() => {
          if (focused) return;
          setQuery("");
          setActiveIndex(-1);
          setFocused(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(-1);
          setFocused(true);
        }}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        className="autocomplete-toggle"
        aria-label={`${focused ? "Fechar" : "Abrir"} lista de ${toggleLabel}`}
        aria-expanded={visibleOptions.length > 0}
        aria-controls={`${id}-options`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (focused) {
            setQuery("");
            setActiveIndex(-1);
            setFocused(false);
            return;
          }
          inputRef.current?.focus();
          setQuery("");
          setActiveIndex(-1);
          setFocused(true);
        }}
      >
        <FontAwesomeIcon icon={focused ? faChevronUp : faChevronDown} aria-hidden="true" />
      </button>
      {visibleOptions.length > 0 && (
        <ul id={`${id}-options`} className="autocomplete-options" role="listbox">
          {visibleOptions.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={activeIndex === index || value === option.value}
              className={activeIndex === index ? "is-active" : undefined}
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectOption(index);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
