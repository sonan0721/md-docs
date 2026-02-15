import { create } from "zustand";
import type { GitHubUser, AuthState } from "@/types";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  /**
   * Redirect to GitHub OAuth login
   */
  login: () => {
    window.location.href = "/api/auth/github";
  },

  /**
   * Logout the current user
   */
  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      // Call logout endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok && !response.redirected) {
        throw new Error("Logout failed");
      }

      set({ user: null, isLoading: false });

      // Refresh the page to clear any cached state
      window.location.href = "/";
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Logout failed";
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Check authentication status by fetching current user
   */
  checkAuth: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to check authentication");
      }

      const data = await response.json();
      set({ user: data.user as GitHubUser | null, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Authentication check failed";
      set({ user: null, error: errorMessage, isLoading: false });
    }
  },
}));
