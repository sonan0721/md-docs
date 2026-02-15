import { create } from "zustand";
import type { RepoState } from "@/types";

const REPO_STORAGE_KEY = "md-docs-selected-repo";

export const useRepoStore = create<RepoState>((set) => ({
  selectedRepo: null,
  isLoading: false,
  error: null,

  /**
   * Select a repository
   */
  selectRepo: (owner: string, repo: string) => {
    const selection = { owner, repo };

    // Persist to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(REPO_STORAGE_KEY, JSON.stringify(selection));
    }

    set({ selectedRepo: selection, error: null });
  },

  /**
   * Clear the selected repository
   */
  clearRepo: () => {
    // Remove from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(REPO_STORAGE_KEY);
    }

    set({ selectedRepo: null, error: null });
  },

  /**
   * Load selected repository from localStorage
   */
  loadFromStorage: () => {
    if (typeof window === "undefined") {
      return;
    }

    set({ isLoading: true });

    try {
      const stored = localStorage.getItem(REPO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.owner && parsed.repo) {
          set({ selectedRepo: parsed, isLoading: false });
          return;
        }
      }
    } catch (err) {
      console.error("Failed to load repo from storage:", err);
    }

    set({ selectedRepo: null, isLoading: false });
  },
}));
