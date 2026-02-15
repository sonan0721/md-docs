"use client";

import { useEffect, useState, useRef } from "react";
import { User, LogOut, Github, ChevronDown, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth";

export function UserMenu() {
  const { user, isLoading, login, logout, checkAuth } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-2">
        <Loader2 size={20} className="animate-spin text-muted" />
      </div>
    );
  }

  // Not logged in - show login button
  if (!user) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface hover:bg-border text-sm transition-colors"
      >
        <Github size={16} />
        <span className="hidden sm:inline">Login</span>
      </button>
    );
  }

  // Logged in - show user menu
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-md hover:bg-surface transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <img
          src={user.avatar_url}
          alt={user.name || user.login}
          className="w-7 h-7 rounded-full"
        />
        <ChevronDown
          size={14}
          className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar_url}
                alt={user.name || user.login}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {user.name || user.login}
                </p>
                <p className="text-sm text-muted truncate">@{user.login}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2 hover:bg-surface transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User size={16} className="text-muted" />
              <span>GitHub Profile</span>
            </a>

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface transition-colors text-left"
            >
              <LogOut size={16} className="text-muted" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
