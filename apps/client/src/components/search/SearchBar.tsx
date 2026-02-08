"use client";

import { useState, FormEvent, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input, Text } from "@repo/ui";
import { useDebouncedValue } from "@/hooks/shared/useDebouncedValue";
import {
  useSearchCategoriesAndSubcategories,
  type SuggestionItem,
} from "@/hooks/search";

/* ----- Presentational: no tRPC, no router ----- */

export interface SearchBarViewProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  suggestionItems: SuggestionItem[];
  isSuggestionsLoading: boolean;
  highlightedIndex: number;
  onHighlightChange: (index: number) => void;
  onDropdownOpenChange: (open: boolean) => void;
  onSelectSuggestion: (item: SuggestionItem) => void;
  showDropdown: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  size?: "default" | "large";
  className?: string;
}

export function SearchBarView({
  value,
  onChange,
  onSubmit,
  suggestionItems,
  isSuggestionsLoading,
  highlightedIndex,
  onHighlightChange,
  onDropdownOpenChange,
  onSelectSuggestion,
  showDropdown,
  onKeyDown,
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
  const inputText = isLarge ? "!text-xl md:!text-lg" : "!text-sm";
  const iconSize = isLarge ? "w-6 h-6 left-5" : "w-4 h-4 left-3";
  const inputRounding = isLarge ? "rounded-xl md:rounded-lg" : "rounded-lg";

  return (
    <form
      onSubmit={onSubmit}
      className={`relative w-full ${className}`}
      role="search"
    >
      <div className="relative" ref={dropdownRef}>
        <Search
          className={`absolute top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10 ${iconSize}`}
          aria-hidden="true"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => value.trim().length >= 1 && onDropdownOpenChange(true)}
          placeholder="Describí lo que estás precisando"
          className={`${inputPadding} ${inputText} ${inputRounding} border-2 border-border focus:border-border focus:outline-none !focus:ring-0 bg-surface shadow-md focus:shadow-lg transition-shadow`}
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
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-border bg-surface shadow-lg"
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
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const prevUrlQueryRef = useRef<string>("");

  const debouncedQuery = useDebouncedValue(searchQuery.trim(), 280);
  const { suggestionItems, isFetching: isSuggestionsLoading } =
    useSearchCategoriesAndSubcategories(debouncedQuery, 10);

  const showDropdown =
    isDropdownOpen &&
    debouncedQuery.length >= 1 &&
    (suggestionItems.length > 0 || isSuggestionsLoading);

  // Sync input from URL when preserveParams and URL q change (e.g. browser back)
  useEffect(() => {
    if (preserveParams) {
      const urlQuery = searchParams.get("q") || "";
      if (urlQuery !== prevUrlQueryRef.current) {
        prevUrlQueryRef.current = urlQuery;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from URL
        setSearchQuery(urlQuery);
      }
    }
  }, [searchParams, preserveParams]);

  // Open dropdown when debounced query has content; close when cleared
  useEffect(() => {
    if (debouncedQuery.length >= 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI from debounced query
      setIsDropdownOpen(true);
      setHighlightedIndex(0);
    } else {
      setIsDropdownOpen(false);
    }
  }, [debouncedQuery]);

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
      router.push(`/search/results?${params.toString()}`);
      setIsDropdownOpen(false);
      setSearchQuery("");
    },
    [preserveParams, searchParams, router]
  );

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      const params = preserveParams
        ? new URLSearchParams(searchParams.toString())
        : new URLSearchParams();
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      } else {
        params.delete("q");
      }
      router.push(`/search/results?${params.toString()}`);
      setIsDropdownOpen(false);
    },
    [searchQuery, preserveParams, searchParams, router]
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

  return (
    <SearchBarView
      value={searchQuery}
      onChange={setSearchQuery}
      onSubmit={handleSubmit}
      suggestionItems={suggestionItems}
      isSuggestionsLoading={isSuggestionsLoading}
      highlightedIndex={highlightedIndex}
      onHighlightChange={setHighlightedIndex}
      onDropdownOpenChange={setIsDropdownOpen}
      onSelectSuggestion={onSelectSuggestion}
      showDropdown={showDropdown}
      onKeyDown={handleKeyDown}
      size={size}
      className={className}
    />
  );
}
