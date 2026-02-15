import { create } from "zustand";
import type { Document, SearchResult } from "@/types";
import { createSearchIndex, search as searchIndex, type SearchIndex } from "@/lib/search";

const RECENT_SEARCHES_KEY = "md-docs-recent-searches";
const MAX_RECENT_SEARCHES = 10;

export interface SearchState {
  // Modal state
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;

  // Query state
  query: string;
  setQuery: (query: string) => void;

  // Search index
  index: SearchIndex | null;
  isIndexing: boolean;
  indexDocuments: (documents: Document[]) => void;

  // Results
  results: SearchResult[];
  isSearching: boolean;
  performSearch: (query: string) => void;

  // Recent searches
  recentSearches: string[];
  addToRecent: (query: string) => void;
  removeFromRecent: (query: string) => void;
  clearRecent: () => void;
  loadRecentSearches: () => void;

  // Navigation
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  selectNext: () => void;
  selectPrevious: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  // Modal state
  isOpen: false,
  openSearch: () => set({ isOpen: true, selectedIndex: 0 }),
  closeSearch: () => set({ isOpen: false, query: "", results: [], selectedIndex: 0 }),
  toggleSearch: () => {
    const { isOpen } = get();
    if (isOpen) {
      get().closeSearch();
    } else {
      get().openSearch();
    }
  },

  // Query state
  query: "",
  setQuery: (query: string) => {
    set({ query });
    get().performSearch(query);
  },

  // Search index
  index: null,
  isIndexing: false,
  indexDocuments: (documents: Document[]) => {
    set({ isIndexing: true });

    // Use requestIdleCallback or setTimeout to avoid blocking
    const doIndex = () => {
      const index = createSearchIndex(documents);
      set({ index, isIndexing: false });
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(doIndex);
    } else {
      setTimeout(doIndex, 0);
    }
  },

  // Results
  results: [],
  isSearching: false,
  performSearch: (query: string) => {
    const { index } = get();

    if (!query.trim()) {
      set({ results: [], isSearching: false, selectedIndex: 0 });
      return;
    }

    if (!index) {
      set({ results: [], isSearching: false });
      return;
    }

    set({ isSearching: true });

    // Debounced search with small delay for typing
    const doSearch = () => {
      const results = searchIndex(index, query, { limit: 20, fuzzy: true });
      set({ results, isSearching: false, selectedIndex: 0 });
    };

    // Use microtask for fast response
    queueMicrotask(doSearch);
  },

  // Recent searches
  recentSearches: [],
  addToRecent: (query: string) => {
    if (!query.trim()) return;

    const { recentSearches } = get();
    const filtered = recentSearches.filter((s) => s !== query);
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);

    set({ recentSearches: updated });

    // Persist to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    }
  },

  removeFromRecent: (query: string) => {
    const { recentSearches } = get();
    const updated = recentSearches.filter((s) => s !== query);

    set({ recentSearches: updated });

    // Persist to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    }
  },

  clearRecent: () => {
    set({ recentSearches: [] });

    // Remove from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  },

  loadRecentSearches: () => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          set({ recentSearches: parsed.slice(0, MAX_RECENT_SEARCHES) });
        }
      }
    } catch (err) {
      console.error("Failed to load recent searches:", err);
    }
  },

  // Navigation
  selectedIndex: 0,
  setSelectedIndex: (index: number) => set({ selectedIndex: index }),
  selectNext: () => {
    const { results, recentSearches, query, selectedIndex } = get();
    const items = query.trim() ? results : recentSearches;
    const maxIndex = items.length - 1;
    set({ selectedIndex: Math.min(selectedIndex + 1, maxIndex) });
  },
  selectPrevious: () => {
    const { selectedIndex } = get();
    set({ selectedIndex: Math.max(selectedIndex - 1, 0) });
  },
}));
