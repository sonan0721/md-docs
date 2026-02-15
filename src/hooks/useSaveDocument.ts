"use client";

import { useState, useCallback, useRef } from "react";

interface UseSaveDocumentOptions {
  owner: string;
  repo: string;
  path: string;
}

interface UseSaveDocumentReturn {
  save: (content: string, message?: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  lastSavedSha: string | null;
  hasConflict: boolean;
}

interface SaveResponse {
  success?: boolean;
  sha?: string;
  commitSha?: string;
  error?: string;
  code?: string;
}

/**
 * Hook for saving documents to GitHub
 * Handles loading states, errors, and conflict detection
 */
export function useSaveDocument(
  options: UseSaveDocumentOptions,
  initialSha?: string
): UseSaveDocumentReturn {
  const { owner, repo, path } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedSha, setLastSavedSha] = useState<string | null>(initialSha || null);
  const [hasConflict, setHasConflict] = useState(false);

  // Track the SHA we loaded with for conflict detection
  const currentShaRef = useRef<string | undefined>(initialSha);

  const save = useCallback(
    async (content: string, message?: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      setHasConflict(false);

      // Generate default commit message if not provided
      const commitMessage = message || `Update ${path.split("/").pop() || path}`;

      try {
        const response = await fetch("/api/github/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            owner,
            repo,
            path,
            content,
            message: commitMessage,
            sha: currentShaRef.current,
          }),
        });

        const data: SaveResponse = await response.json();

        if (!response.ok) {
          // Check for conflict
          if (response.status === 409 || data.code === "CONFLICT") {
            setHasConflict(true);
            setError(data.error || "File has been modified. Please refresh and try again.");
            return false;
          }

          setError(data.error || "Failed to save document");
          return false;
        }

        if (data.success && data.sha) {
          // Update the SHA for future saves
          currentShaRef.current = data.sha;
          setLastSavedSha(data.sha);
          return true;
        }

        setError("Unexpected response from server");
        return false;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to save document";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [owner, repo, path]
  );

  const clearError = useCallback(() => {
    setError(null);
    setHasConflict(false);
  }, []);

  return {
    save,
    isLoading,
    error,
    clearError,
    lastSavedSha,
    hasConflict,
  };
}
