"use client";

import { useState, ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { RightPanel } from "./RightPanel";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface BacklinkItem {
  slug: string;
  title: string;
  context: string;
}

interface FolderItem {
  name: string;
  type: "folder" | "file";
  children?: FolderItem[];
  slug?: string;
}

interface ShellProps {
  children: ReactNode;
  showRightPanel?: boolean;
  toc?: TocItem[];
  backlinks?: BacklinkItem[];
  activeId?: string;
  folders?: FolderItem[];
  tags?: string[];
}

export function Shell({
  children,
  showRightPanel = true,
  toc = [],
  backlinks = [],
  activeId,
  folders = [],
  tags = [],
}: ShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchOpen = () => {
    setSearchOpen(true);
    // TODO: Implement search modal
    console.log("Search opened");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSearchOpen={handleSearchOpen} />

      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar folders={folders} tags={tags} />

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-content mx-auto px-6 py-8">
            {children}
          </div>
        </main>

        {/* Right Panel */}
        {showRightPanel && (
          <RightPanel toc={toc} backlinks={backlinks} activeId={activeId} />
        )}
      </div>

      {/* Search Modal Placeholder */}
      {searchOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-background border border-border rounded-lg shadow-lg w-full max-w-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              placeholder="Search documentation..."
              className="w-full px-4 py-2 bg-surface border border-border rounded-md text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            <p className="text-sm text-muted mt-2">
              Start typing to search...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
