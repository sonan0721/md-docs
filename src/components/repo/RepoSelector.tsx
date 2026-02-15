"use client";

import { useState, useEffect } from "react";
import { GitBranch, Lock, Globe, Search, X, RefreshCw } from "lucide-react";
import { useRepoStore } from "@/stores/repo";
import type { GitHubRepo } from "@/types";

interface RepoSelectorProps {
  onClose?: () => void;
}

export function RepoSelector({ onClose }: RepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { selectRepo } = useRepoStore();

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/github/repos", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }

      const data = await response.json();
      setRepos(data.repos || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load repositories";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleSelectRepo = (repo: GitHubRepo) => {
    const [owner, repoName] = repo.full_name.split("/");
    selectRepo(owner, repoName);
    onClose?.();
  };

  const filteredRepos = repos.filter((repo) =>
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">Select Repository</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRepos}
              className="p-2 rounded-md hover:bg-surface transition-colors text-muted hover:text-text"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-surface transition-colors text-muted hover:text-text"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-md text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Repository List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={24} className="animate-spin text-muted" />
              <span className="ml-2 text-muted">Loading repositories...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchRepos}
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="text-center py-8 text-muted">
              {searchQuery
                ? "No repositories match your search"
                : "No repositories found"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredRepos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => handleSelectRepo(repo)}
                  className="w-full text-left p-3 rounded-md hover:bg-surface transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <GitBranch size={18} className="text-muted mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text group-hover:text-accent truncate">
                          {repo.full_name}
                        </span>
                        {repo.private ? (
                          <Lock size={14} className="text-muted flex-shrink-0" />
                        ) : (
                          <Globe size={14} className="text-muted flex-shrink-0" />
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-sm text-muted truncate mt-0.5">
                          {repo.description}
                        </p>
                      )}
                      <p className="text-xs text-muted mt-1">
                        Updated {formatDate(repo.updated_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface/50">
          <p className="text-sm text-muted text-center">
            Select a repository containing your markdown wiki files
          </p>
        </div>
      </div>
    </div>
  );
}
