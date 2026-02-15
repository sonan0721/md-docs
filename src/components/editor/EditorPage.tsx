"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, X, FileText, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { Editor } from "./Editor";
import { extractFrontmatter, combineFrontmatter } from "@/lib/editor";
import { useSaveDocument } from "@/hooks/useSaveDocument";
import { useRepoStore } from "@/stores/repo";

interface EditorPageProps {
  slug: string;
  initialContent: string;
  title: string;
  initialSha?: string;
}

export function EditorPage({ slug, initialContent, title, initialSha }: EditorPageProps) {
  const router = useRouter();
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Get selected repo from store
  const { selectedRepo, loadFromStorage } = useRepoStore();

  // Load repo from storage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Build file path from slug
  const filePath = `${slug}.md`;

  // Use save document hook (only if repo is selected)
  const {
    save,
    isLoading: isSaving,
    error,
    clearError,
    hasConflict,
  } = useSaveDocument(
    {
      owner: selectedRepo?.owner || "",
      repo: selectedRepo?.repo || "",
      path: filePath,
    },
    initialSha
  );

  // Extract frontmatter and body
  const { frontmatter, body } = extractFrontmatter(initialContent);
  const [content, setContent] = useState(body);
  const [originalContent] = useState(body);

  // Handle content changes
  const handleChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      setHasChanges(newContent !== originalContent);
    },
    [originalContent]
  );

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // Handle save
  const handleSave = async () => {
    clearError();
    setSaveSuccess(false);

    // Check if repo is selected
    if (!selectedRepo) {
      // Fall back to local save simulation for demo purposes
      console.log("No repository selected. Simulating local save.");
      console.log("Content:", combineFrontmatter(frontmatter, content));

      // Mark as saved
      setHasChanges(false);
      setSaveSuccess(true);

      // Hide success message after 2 seconds then navigate
      setTimeout(() => {
        router.push(`/docs/${slug}`);
      }, 1000);
      return;
    }

    // Combine frontmatter with new content
    const fullContent = combineFrontmatter(frontmatter, content);

    // Generate commit message
    const commitMessage = `Update ${title}`;

    // Save to GitHub
    const success = await save(fullContent, commitMessage);

    if (success) {
      // Mark as saved
      setHasChanges(false);
      setSaveSuccess(true);

      // Show success briefly then navigate back
      setTimeout(() => {
        router.push(`/docs/${slug}`);
      }, 1500);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) return;
    }
    router.push(`/docs/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-muted" />
              <div>
                <h1 className="text-lg font-semibold text-text">
                  Editing: {title}
                </h1>
                <p className="text-sm text-muted">{slug}.md</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="text-sm text-muted mr-2">Unsaved changes</span>
              )}

              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 text-text bg-surface hover:bg-border rounded-md transition-colors"
              >
                <X size={16} />
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="flex items-center gap-2 px-4 py-2 text-white bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                <Save size={16} />
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Success Banner */}
      {saveSuccess && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-green-600 dark:text-green-400">
            <CheckCircle size={16} />
            <span className="text-sm">Document saved successfully! Redirecting...</span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
            {hasConflict && (
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 dark:bg-red-800/30 hover:bg-red-200 dark:hover:bg-red-800/50 rounded transition-colors"
              >
                <RefreshCw size={12} />
                Reload
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-background border border-border rounded-lg p-6">
          <Editor content={content} onChange={handleChange} editable={true} />
        </div>
      </main>

      {/* Keyboard Shortcuts Help */}
      <footer className="fixed bottom-4 right-4">
        <div className="text-xs text-muted bg-surface border border-border rounded-md px-3 py-2">
          <span className="font-medium">Shortcuts:</span> Cmd+B Bold, Cmd+I
          Italic, Cmd+K Link, / Commands
        </div>
      </footer>
    </div>
  );
}
