"use client";

import { Menu, Search, User } from "lucide-react";

interface HeaderProps {
  onSearchOpen: () => void;
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function Header({ onSearchOpen, onMenuClick, showMenu = false }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {showMenu && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-surface transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        )}
        <span className="text-xl font-bold">Wiki</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSearchOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface text-muted hover:text-text transition-colors"
        >
          <Search size={16} />
          <span className="text-sm hidden sm:inline">Search</span>
          <kbd className="text-xs bg-background px-1.5 py-0.5 rounded border border-border hidden sm:inline">⌘K</kbd>
        </button>

        <button className="p-2 rounded-md hover:bg-surface transition-colors">
          <User size={20} />
        </button>
      </div>
    </header>
  );
}
