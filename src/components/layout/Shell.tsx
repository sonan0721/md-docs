"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { RightPanel } from "./RightPanel";
import { SearchModal } from "@/components/search/SearchModal";
import { useIsTablet, useIsLaptop } from "@/hooks/useMediaQuery";
import { useSearchKeyboard, useSearchIndex } from "@/hooks/useSearch";
import { useSearchStore } from "@/stores/search";
import type { FolderNode } from "@/lib/content";
import type { Document } from "@/types";

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

interface ShellProps {
  children: ReactNode;
  showRightPanel?: boolean;
  toc?: TocItem[];
  backlinks?: BacklinkItem[];
  activeId?: string;
  tree?: FolderNode[];
  tags?: string[];
  documents?: Document[];
}

export function Shell({
  children,
  showRightPanel = true,
  toc = [],
  backlinks = [],
  activeId,
  tree = [],
  tags = [],
  documents = [],
}: ShellProps) {
  const { openSearch, closeSearch, loadRecentSearches } = useSearchStore();

  // Initialize keyboard shortcuts for search
  useSearchKeyboard();

  // Index documents for search
  useSearchIndex(documents);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  // Sidebar state (for mobile/tablet)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isTablet = useIsTablet();
  const isLaptop = useIsLaptop();

  const handleSearchOpen = () => {
    openSearch();
  };

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  // Determine if right panel should be visible
  // Hide on laptop (< 1280px) and smaller
  const shouldShowRightPanel = showRightPanel && !isLaptop;

  return (
    <div className="min-h-screen bg-background">
      <Header
        onSearchOpen={handleSearchOpen}
        onMenuClick={handleMenuClick}
        showMenu={isTablet}
      />

      <div className="flex">
        {/* Left Sidebar - Fixed on desktop, overlay drawer on tablet/mobile */}
        {isTablet ? (
          <>
            {/* Backdrop */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={handleCloseSidebar}
              />
            )}
            {/* Drawer */}
            <div
              className={`fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="relative h-full bg-background border-r border-border">
                <button
                  onClick={handleCloseSidebar}
                  className="absolute top-3 right-3 p-1 rounded-md hover:bg-surface transition-colors z-10"
                  aria-label="Close sidebar"
                >
                  <X size={20} />
                </button>
                <Sidebar tree={tree} tags={tags} />
              </div>
            </div>
          </>
        ) : (
          <Sidebar tree={tree} tags={tags} />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className={`mx-auto px-6 py-8 ${isTablet ? "w-full" : "max-w-content"}`}>
            {children}
          </div>
        </main>

        {/* Right Panel - Hidden on laptop and smaller */}
        {shouldShowRightPanel && (
          <RightPanel toc={toc} backlinks={backlinks} activeId={activeId} />
        )}
      </div>

      {/* Search Modal */}
      <SearchModal onClose={closeSearch} />
    </div>
  );
}
