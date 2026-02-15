"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Clock,
  X,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Loader2,
} from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import type { SearchResult } from "@/types";

interface SearchModalProps {
  onClose?: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const {
    isOpen,
    closeSearch,
    query,
    setQuery,
    results,
    isSearching,
    isIndexing,
    recentSearches,
    addToRecent,
    removeFromRecent,
    selectedIndex,
    setSelectedIndex,
    selectNext,
    selectPrevious,
  } = useSearch();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Handle navigation to result
  const navigateToResult = useCallback(
    (result: SearchResult | string) => {
      if (typeof result === "string") {
        // It's a recent search, set it as query
        setQuery(result);
      } else {
        // It's a search result, navigate to it
        addToRecent(query);
        closeSearch();
        onClose?.();
        router.push(`/docs/${result.slug}`);
      }
    },
    [addToRecent, closeSearch, onClose, query, router, setQuery]
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          selectNext();
          break;
        case "ArrowUp":
          event.preventDefault();
          selectPrevious();
          break;
        case "Enter":
          event.preventDefault();
          const items = query.trim() ? results : recentSearches;
          const selected = items[selectedIndex];
          if (selected) {
            navigateToResult(selected);
          }
          break;
        case "Escape":
          event.preventDefault();
          closeSearch();
          onClose?.();
          break;
      }
    },
    [
      selectNext,
      selectPrevious,
      query,
      results,
      recentSearches,
      selectedIndex,
      navigateToResult,
      closeSearch,
      onClose,
    ]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        closeSearch();
        onClose?.();
      }
    },
    [closeSearch, onClose]
  );

  // Handle remove recent
  const handleRemoveRecent = useCallback(
    (event: React.MouseEvent, searchQuery: string) => {
      event.stopPropagation();
      removeFromRecent(searchQuery);
    },
    [removeFromRecent]
  );

  if (!isOpen) return null;

  const hasQuery = query.trim().length > 0;
  const showRecent = !hasQuery && recentSearches.length > 0;
  const showResults = hasQuery && results.length > 0;
  const showNoResults = hasQuery && !isSearching && results.length === 0;
  const showEmpty = !hasQuery && recentSearches.length === 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh]"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-background border border-border rounded-lg shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={20} className="text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent text-text placeholder:text-muted text-lg focus:outline-none"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {isSearching || isIndexing ? (
            <Loader2 size={20} className="text-muted animate-spin flex-shrink-0" />
          ) : (
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-muted bg-surface rounded border border-border">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Area */}
        <div
          ref={resultsRef}
          className="max-h-[60vh] overflow-y-auto"
        >
          {/* Indexing State */}
          {isIndexing && (
            <div className="px-4 py-8 text-center">
              <Loader2 size={24} className="mx-auto mb-2 text-muted animate-spin" />
              <p className="text-sm text-muted">Building search index...</p>
            </div>
          )}

          {/* Recent Searches */}
          {showRecent && !isIndexing && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-muted uppercase tracking-wider">
                Recent Searches
              </div>
              {recentSearches.map((recentQuery, index) => (
                <button
                  key={recentQuery}
                  data-index={index}
                  onClick={() => navigateToResult(recentQuery)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    selectedIndex === index
                      ? "bg-accent/10 text-accent"
                      : "hover:bg-surface text-text"
                  }`}
                >
                  <Clock size={16} className="text-muted flex-shrink-0" />
                  <span className="flex-1 truncate">{recentQuery}</span>
                  <button
                    onClick={(e) => handleRemoveRecent(e, recentQuery)}
                    className="p-1 rounded hover:bg-surface-hover text-muted hover:text-text"
                    aria-label="Remove from recent"
                  >
                    <X size={14} />
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {showResults && !isIndexing && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-muted uppercase tracking-wider">
                Results ({results.length})
              </div>
              {results.map((result, index) => (
                <button
                  key={result.slug}
                  data-index={index}
                  onClick={() => navigateToResult(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                    selectedIndex === index
                      ? "bg-accent/10"
                      : "hover:bg-surface"
                  }`}
                >
                  <FileText
                    size={18}
                    className={`flex-shrink-0 mt-0.5 ${
                      selectedIndex === index ? "text-accent" : "text-muted"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium truncate ${
                          selectedIndex === index ? "text-accent" : "text-text"
                        }`}
                      >
                        {result.title}
                      </span>
                      <span className="text-xs text-muted flex-shrink-0">
                        {result.score}%
                      </span>
                    </div>
                    <div className="text-sm text-muted truncate">
                      {result.path}
                    </div>
                    {result.excerpt && (
                      <div className="mt-1 text-sm text-muted line-clamp-2">
                        {result.excerpt}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {showNoResults && !isIndexing && (
            <div className="px-4 py-8 text-center">
              <Search size={24} className="mx-auto mb-2 text-muted opacity-50" />
              <p className="text-sm text-muted">
                No results found for &quot;{query}&quot;
              </p>
              <p className="text-xs text-muted mt-1">
                Try searching with different keywords or Korean initial consonants (chosung)
              </p>
            </div>
          )}

          {/* Empty State */}
          {showEmpty && !isIndexing && (
            <div className="px-4 py-8 text-center">
              <Search size={24} className="mx-auto mb-2 text-muted opacity-50" />
              <p className="text-sm text-muted">
                Start typing to search...
              </p>
              <p className="text-xs text-muted mt-1">
                Supports Korean search including initial consonants (e.g., &quot;ㅍㄹㅈ&quot; for &quot;프로젝트&quot;)
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface/50 text-xs text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ArrowUp size={12} />
              <ArrowDown size={12} />
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft size={12} />
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-background rounded border border-border">ESC</kbd>
              Close
            </span>
          </div>
          <div>
            Powered by FlexSearch
          </div>
        </div>
      </div>
    </div>
  );
}
