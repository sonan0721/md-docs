"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, X, FileText, AlertCircle } from "lucide-react";
import { Editor } from "./Editor";
import { extractFrontmatter, combineFrontmatter } from "@/lib/editor";

interface EditorPageProps {
  slug: string;
  initialContent: string;
  title: string;
}

export function EditorPage({ slug, initialContent, title }: EditorPageProps) {
  const router = useRouter();
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setIsSaving(true);
    setError(null);

    try {
      // Combine frontmatter with new content
      const fullContent = combineFrontmatter(frontmatter, content);

      // TODO: In Phase 7, this will commit to GitHub
      // For now, we'll just log and show success
      console.log("Saving document:", slug);
      console.log("Content:", fullContent);

      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mark as saved
      setHasChanges(false);

      // Navigate back to document view
      router.push(`/docs/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save document");
    } finally {
      setIsSaving(false);
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

      {/* Error Banner */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
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
