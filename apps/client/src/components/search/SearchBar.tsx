"use client";

import { useState, FormEvent, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { Button, Input, Text } from "@repo/ui";
import { useSearchLocation } from "@/contexts/SearchLocationContext";
import { useClickOutside } from "@/hooks/shared/useClickOutside";
import { useDebouncedValue } from "@/hooks/shared/useDebouncedValue";
import {
  useSearchCategoriesAndSubcategories,
  type SuggestionItem,
} from "@/hooks/search";

/* ----- Presentational: no tRPC, no router ----- */

export interface SearchBarViewProps {
  value: string;
  onChange: (value: string) => void;
  zipValue: string;
  /** When true, zip field is read-only (from geolocation); zipOnChange is ignored. */
  isZipReadOnly?: boolean;
  zipOnChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  suggestionItems: SuggestionItem[];
  isSuggestionsLoading: boolean;
  highlightedIndex: number;
  onHighlightChange: (index: number) => void;
  onDropdownOpenChange: (open: boolean) => void;
  onSelectSuggestion: (item: SuggestionItem) => void;
  onFocus?: () => void;
  showDropdown: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** When true, search was submitted empty; show danger state */
  showEmptyError?: boolean;
  /** Ref for the form/wrapper so container can detect clicks outside */
  containerRef?: React.RefObject<HTMLFormElement | null>;
  size?: "default" | "large";
  className?: string;
}

export function SearchBarView({
  value,
  onChange,
  zipValue,
  isZipReadOnly = false,
  zipOnChange,
  onSubmit,
  suggestionItems,
  isSuggestionsLoading,
  highlightedIndex,
  onHighlightChange,
  onDropdownOpenChange,
  onSelectSuggestion,
  onFocus,
  showDropdown,
  onKeyDown,
  showEmptyError = false,
  containerRef,
  size = "default",
  className = "",
}: SearchBarViewProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onDropdownOpenChange(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onDropdownOpenChange]);

  const isLarge = size === "large";
  const inputPadding = isLarge
    ? "!pl-14 !pr-5 !py-5 md:!py-4"
    : "!pl-10 !pr-4 !py-2";
  const zipInputPadding = isLarge ? "!px-0 !py-5 md:!py-4" : "!px-0 !py-2";
  const inputText = isLarge ? "!text-xl md:!text-lg" : "!text-sm";
  const iconSize = isLarge ? "w-6 h-6 left-5" : "w-4 h-4 left-3";
  const buttonPadding = isLarge ? "px-6 py-5 md:py-4" : "px-4 py-2";

  return (
    <form
      ref={containerRef}
      onSubmit={onSubmit}
      className={`relative w-full ${className}`}
      role="search"
    >
      <div
        className={`flex flex-nowrap items-stretch gap-0 rounded-lg shadow-md transition-shadow focus-within:shadow-lg ${
          showEmptyError ? "ring-2 ring-danger" : ""
        }`}
      >
        <div className="relative flex-1 min-w-0" ref={dropdownRef}>
          <Search
            className={`absolute top-1/2 -translate-y-1/2 pointer-events-none z-10 ${iconSize} ${
              showEmptyError ? "text-danger" : "text-muted"
            }`}
            aria-hidden="true"
          />
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => {
              onFocus?.();
              if (value.trim().length >= 1) {
                onDropdownOpenChange(true);
              }
            }}
            placeholder="Describí lo que estás precisando"
            className={`w-full h-full border-0 border-r ${inputPadding} ${inputText} rounded-l-lg rounded-r-none! md:rounded-r-none! focus:ring-0 bg-surface ${
              showEmptyError ? "border-danger" : "border-border"
            }`}
            aria-label="Buscar profesionales"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls="search-suggestions"
            aria-activedescendant={
              showDropdown && suggestionItems[highlightedIndex]
                ? `suggestion-${highlightedIndex}`
                : undefined
            }
          />
          {showDropdown && (
            <div
              id="search-suggestions"
              role="listbox"
              className="absolute left-0 right-0 top-full z-20 max-h-72 overflow-auto rounded-b-lg border border-t-0 border-border bg-surface shadow-lg"
            >
              {isSuggestionsLoading ? (
                <div className="px-4 py-3 text-muted">
                  <Text variant="small">Buscando...</Text>
                </div>
              ) : (
                suggestionItems.map((item, index) => (
                  <button
                    key={`${item.type}-${item.slug}-${item.name}`}
                    type="button"
                    role="option"
                    id={`suggestion-${index}`}
                    aria-selected={index === highlightedIndex}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                      index === highlightedIndex
                        ? "bg-muted/80"
                        : "bg-surface hover:bg-muted/50"
                    }`}
                    onMouseEnter={() => onHighlightChange(index)}
                    onClick={() => onSelectSuggestion(item)}
                  >
                    {item.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1.5 w-24 sm:w-28 border-0 border-r border-border pl-2.5 pr-2 bg-surface">
          <MapPin
            className={`shrink-0 ${isLarge ? "w-5 h-5" : "w-4 h-4"} text-muted`}
            aria-hidden="true"
          />
          <Input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={zipValue}
            onChange={(e) =>
              !isZipReadOnly && zipOnChange(e.target.value.replace(/\D/g, ""))
            }
            readOnly={isZipReadOnly}
            placeholder="CP"
            className={`flex-1 min-w-0 h-full border-0 ${zipInputPadding} text-left ${inputText} rounded-none focus:ring-0 bg-transparent text-center ${isZipReadOnly ? "cursor-default" : ""}`}
            aria-label="Código postal (opcional)"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          className={`shrink-0 ${buttonPadding} rounded-r-lg rounded-l-none shadow-none! border-0`}
          aria-label="Buscar"
        >
          Buscar
        </Button>
      </div>
      {showEmptyError && (
        <p className="mt-1.5 text-sm text-danger" role="alert">
          Ingresá qué estás buscando
        </p>
      )}
    </form>
  );
}

/* ----- Container: uses hooks (tRPC, router), passes props to view ----- */

interface SearchBarProps {
  initialQuery?: string;
  preserveParams?: boolean;
  size?: "default" | "large";
  className?: string;
}

/**
 * Search bar with typeahead: suggests categories and subcategories (FTS + trigram).
 * Supports preserving existing query parameters when navigating.
 * Keyboard: ArrowDown/ArrowUp to move, Enter to select or submit, Escape to close.
 */
export function SearchBar({
  initialQuery = "",
  preserveParams = false,
  size = "default",
  className = "",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [zipCode, setZipCode] = useState(() =>
    preserveParams ? searchParams.get("zipCode") || "" : ""
  );
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showEmptyError, setShowEmptyError] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const prevUrlQueryRef = useRef<string>("");
  const prevUrlZipRef = useRef<string>("");
  const prevUrlLocationRef = useRef<string>("");
  const barRef = useRef<HTMLFormElement>(null);
  const appliedInitialZipRef = useRef(false);
  const { initialZipCode, initialLocation } = useSearchLocation();

  const clearEmptyError = useCallback(() => setShowEmptyError(false), []);
  useClickOutside(barRef, clearEmptyError);

  // Auto-detect zip and location on load: apply once when context provides them (only when not reading from URL).
  useEffect(() => {
    if (preserveParams) return;
    if (initialZipCode?.trim() && !appliedInitialZipRef.current) {
      appliedInitialZipRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from external context (geolocation)
      setZipCode(initialZipCode.trim());
    }
  }, [preserveParams, initialZipCode]);

  // Track location for submit: we use initialLocation from context when not preserveParams
  const locationForSubmit = preserveParams
    ? searchParams.get("location") || ""
    : (initialLocation ?? "");

  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 280);
  const { suggestionItems, isFetching: isSuggestionsLoading } =
    useSearchCategoriesAndSubcategories(debouncedQuery, 3);

  const showDropdown =
    isDropdownOpen &&
    debouncedQuery.length >= 1 &&
    (suggestionItems.length > 0 || isSuggestionsLoading);

  // Sync input from URL when preserveParams and URL params change (e.g. browser back)
  useEffect(() => {
    if (preserveParams) {
      const urlQuery = searchParams.get("q") || "";
      if (urlQuery !== prevUrlQueryRef.current) {
        prevUrlQueryRef.current = urlQuery;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from URL
        setSearchQuery(urlQuery);
      }
      const urlZip = searchParams.get("zipCode") || "";
      if (urlZip !== prevUrlZipRef.current) {
        prevUrlZipRef.current = urlZip;
        setZipCode(urlZip);
      }
      prevUrlLocationRef.current = searchParams.get("location") || "";
    }
  }, [searchParams, preserveParams]);

  // Prefill from subcategory name when preserveParams, no q in URL, and initialQuery becomes available
  useEffect(() => {
    if (
      preserveParams &&
      !hasInteracted &&
      initialQuery.trim() &&
      !(searchParams.get("q") || "").trim()
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill from subcategory when no user interaction yet
      setSearchQuery(initialQuery.trim());
    }
  }, [preserveParams, initialQuery, searchParams, hasInteracted]);

  // Open dropdown only when user has interacted (focus or typed) and query has content; close when cleared
  useEffect(() => {
    if (hasInteracted && debouncedQuery.length >= 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI from debounced query
      setIsDropdownOpen(true);
      setHighlightedIndex(0);
    } else {
      setIsDropdownOpen(false);
    }
  }, [hasInteracted, debouncedQuery]);

  // Reset highlight when suggestion list length changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync highlight to list length
    setHighlightedIndex(0);
  }, [suggestionItems.length]);

  const onSelectSuggestion = useCallback(
    (item: SuggestionItem) => {
      const params = preserveParams
        ? new URLSearchParams(searchParams.toString())
        : new URLSearchParams();
      if (item.type === "category") {
        params.set("category", item.slug);
        params.delete("subcategory");
        params.delete("q");
      } else {
        params.set("category", item.categorySlug);
        params.set("subcategory", item.slug);
        params.delete("q");
      }
      if (locationForSubmit.trim()) {
        params.set("location", locationForSubmit.trim());
      } else {
        params.delete("location");
      }
      if (zipCode.trim()) {
        params.set("zipCode", zipCode.trim());
      } else {
        params.delete("zipCode");
      }
      router.push(`/search/results?${params.toString()}`);
      setIsDropdownOpen(false);
      setSearchQuery("");
    },
    [preserveParams, searchParams, router, zipCode, locationForSubmit]
  );

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsDropdownOpen(false);
      if (!searchQuery.trim()) {
        setShowEmptyError(true);
        return;
      }
      setShowEmptyError(false);
      const params = preserveParams
        ? new URLSearchParams(searchParams.toString())
        : new URLSearchParams();
      params.set("q", searchQuery.trim());
      if (locationForSubmit.trim()) {
        params.set("location", locationForSubmit.trim());
      } else {
        params.delete("location");
      }
      if (zipCode.trim()) {
        params.set("zipCode", zipCode.trim());
      } else {
        params.delete("zipCode");
      }
      router.push(`/search/results?${params.toString()}`);
    },
    [
      searchQuery,
      zipCode,
      locationForSubmit,
      preserveParams,
      searchParams,
      router,
    ]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown || suggestionItems.length === 0) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
        }
        return;
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((i) =>
            i < suggestionItems.length - 1 ? i + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((i) =>
            i > 0 ? i - 1 : suggestionItems.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          onSelectSuggestion(suggestionItems[highlightedIndex]!);
          break;
        case "Escape":
          e.preventDefault();
          setIsDropdownOpen(false);
          break;
        default:
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
          }
      }
    },
    [
      showDropdown,
      suggestionItems,
      highlightedIndex,
      onSelectSuggestion,
      handleSubmit,
    ]
  );

  const handleSearchChange = useCallback((value: string) => {
    setHasInteracted(true);
    setSearchQuery(value);
    setShowEmptyError(false);
  }, []);

  const handleFocus = useCallback(() => setHasInteracted(true), []);

  return (
    <SearchBarView
      value={searchQuery}
      onChange={handleSearchChange}
      zipValue={zipCode}
      isZipReadOnly={true}
      zipOnChange={setZipCode}
      onSubmit={handleSubmit}
      suggestionItems={suggestionItems}
      isSuggestionsLoading={isSuggestionsLoading}
      highlightedIndex={highlightedIndex}
      onHighlightChange={setHighlightedIndex}
      onDropdownOpenChange={setIsDropdownOpen}
      onSelectSuggestion={onSelectSuggestion}
      onFocus={handleFocus}
      showDropdown={showDropdown}
      onKeyDown={handleKeyDown}
      showEmptyError={showEmptyError}
      containerRef={barRef}
      size={size}
      className={className}
    />
  );
}
