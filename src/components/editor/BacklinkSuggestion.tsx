"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Editor } from "@tiptap/react";
import { FileText, Plus } from "lucide-react";

interface BacklinkSuggestionProps {
  editor: Editor;
  documents: { slug: string; title: string }[];
  onCreateNew?: (title: string) => void;
}

interface SuggestionItem {
  slug: string;
  title: string;
  isNew?: boolean;
}

export function BacklinkSuggestion({
  editor,
  documents,
  onCreateNew,
}: BacklinkSuggestionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter documents based on search
  const filteredDocs: SuggestionItem[] = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Add "Create new" option if search doesn't match existing doc
  const suggestions: SuggestionItem[] = [...filteredDocs];
  if (
    search.length > 0 &&
    !filteredDocs.some(
      (doc) => doc.title.toLowerCase() === search.toLowerCase()
    )
  ) {
    suggestions.push({
      slug: "",
      title: search,
      isNew: true,
    });
  }

  const executeSelection = useCallback(
    (item: SuggestionItem) => {
      // Find and delete the [[ trigger and search text
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 50),
        from,
        ""
      );
      const bracketIndex = textBefore.lastIndexOf("[[");

      if (bracketIndex !== -1) {
        const deleteFrom = from - (textBefore.length - bracketIndex);

        // Insert the complete backlink
        editor
          .chain()
          .focus()
          .deleteRange({ from: deleteFrom, to: from })
          .insertContent(`[[${item.title}]]`)
          .run();
      }

      // Handle new document creation
      if (item.isNew && onCreateNew) {
        onCreateNew(item.title);
      }

      setIsOpen(false);
      setSearch("");
      setSelectedIndex(0);
    },
    [editor, onCreateNew]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            executeSelection(suggestions[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSearch("");
          setSelectedIndex(0);
          break;
        case "Tab":
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            executeSelection(suggestions[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, suggestions, selectedIndex, executeSelection]);

  // Watch for [[ trigger
  useEffect(() => {
    const handleUpdate = () => {
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 50),
        from,
        ""
      );

      // Check for [[ pattern
      const backlinkMatch = textBefore.match(/\[\[([^\]]*?)$/);

      if (backlinkMatch) {
        // Get cursor position
        const coords = editor.view.coordsAtPos(from);
        const editorRect = editor.view.dom.getBoundingClientRect();

        setPosition({
          top: coords.bottom - editorRect.top + 8,
          left: coords.left - editorRect.left,
        });

        setSearch(backlinkMatch[1]);
        setIsOpen(true);
        setSelectedIndex(0);
      } else {
        setIsOpen(false);
        setSearch("");
      }
    };

    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const selectedElement = menuRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-background border border-border rounded-lg shadow-lg overflow-hidden min-w-[280px] max-w-[400px]"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="p-2 border-b border-border">
        <span className="text-xs text-muted">Link to document</span>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {suggestions.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted text-center">
            No documents found
          </div>
        ) : (
          suggestions.map((item, index) => (
            <button
              key={item.isNew ? `new-${item.title}` : item.slug}
              data-index={index}
              onClick={() => executeSelection(item)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                index === selectedIndex
                  ? "bg-surface text-text"
                  : "text-text hover:bg-surface"
              }`}
            >
              <span className="flex-shrink-0 text-muted">
                {item.isNew ? <Plus size={16} /> : <FileText size={16} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {item.isNew ? `Create "${item.title}"` : item.title}
                </div>
                {!item.isNew && (
                  <div className="text-xs text-muted truncate">{item.slug}</div>
                )}
              </div>
              {item.isNew && (
                <span className="flex-shrink-0 text-xs text-accent">New</span>
              )}
            </button>
          ))
        )}
      </div>
      <div className="px-3 py-2 border-t border-border bg-surface/50">
        <span className="text-xs text-muted">
          <kbd className="px-1 py-0.5 bg-background rounded text-[10px]">↑↓</kbd> to navigate{" "}
          <kbd className="px-1 py-0.5 bg-background rounded text-[10px]">Enter</kbd> to select{" "}
          <kbd className="px-1 py-0.5 bg-background rounded text-[10px]">Esc</kbd> to close
        </span>
      </div>
    </div>
  );
}
