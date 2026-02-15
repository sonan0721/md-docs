"use client";

import { useEffect, useCallback } from "react";
import { useSearchStore } from "@/stores/search";
import type { Document, SearchResult } from "@/types";

export interface UseSearchReturn {
  // Modal
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;

  // Query
  query: string;
  setQuery: (query: string) => void;

  // Results
  results: SearchResult[];
  isSearching: boolean;
  isIndexing: boolean;

  // Recent
  recentSearches: string[];
  addToRecent: (query: string) => void;
  removeFromRecent: (query: string) => void;
  clearRecent: () => void;

  // Navigation
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  getSelectedItem: () => SearchResult | string | null;

  // Index
  indexDocuments: (documents: Document[]) => void;
}

/**
 * Hook for search functionality
 * Provides search state and actions
 */
export function useSearch(): UseSearchReturn {
  const {
    isOpen,
    openSearch,
    closeSearch,
    toggleSearch,
    query,
    setQuery,
    results,
    isSearching,
    isIndexing,
    recentSearches,
    addToRecent,
    removeFromRecent,
    clearRecent,
    loadRecentSearches,
    selectedIndex,
    setSelectedIndex,
    selectNext,
    selectPrevious,
    indexDocuments,
  } = useSearchStore();

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  // Get currently selected item
  const getSelectedItem = useCallback((): SearchResult | string | null => {
    if (query.trim()) {
      return results[selectedIndex] || null;
    }
    return recentSearches[selectedIndex] || null;
  }, [query, results, recentSearches, selectedIndex]);

  return {
    isOpen,
    openSearch,
    closeSearch,
    toggleSearch,
    query,
    setQuery,
    results,
    isSearching,
    isIndexing,
    recentSearches,
    addToRecent,
    removeFromRecent,
    clearRecent,
    selectedIndex,
    setSelectedIndex,
    selectNext,
    selectPrevious,
    getSelectedItem,
    indexDocuments,
  };
}

/**
 * Hook for keyboard shortcuts
 * Opens search modal with Cmd+K or Ctrl+K
 */
export function useSearchKeyboard(): void {
  const { toggleSearch, isOpen, closeSearch, selectNext, selectPrevious } =
    useSearchStore();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Cmd+K or Ctrl+K to toggle search
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        toggleSearch();
        return;
      }

      // ESC to close search
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        closeSearch();
        return;
      }

      // Arrow navigation when search is open
      if (isOpen) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          selectNext();
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          selectPrevious();
          return;
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleSearch, isOpen, closeSearch, selectNext, selectPrevious]);
}

/**
 * Hook to initialize search index with documents
 */
export function useSearchIndex(documents: Document[] | undefined): void {
  const { indexDocuments } = useSearchStore();

  useEffect(() => {
    if (documents && documents.length > 0) {
      indexDocuments(documents);
    }
  }, [documents, indexDocuments]);
}
