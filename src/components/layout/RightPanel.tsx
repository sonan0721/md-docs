"use client";

import { Link, List } from "lucide-react";

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

interface RightPanelProps {
  toc?: TocItem[];
  backlinks?: BacklinkItem[];
  activeId?: string;
}

export function RightPanel({ toc = [], backlinks = [], activeId }: RightPanelProps) {
  return (
    <aside className="w-rightpanel h-[calc(100vh-3.5rem)] border-l border-border bg-background overflow-y-auto p-4">
      {/* Table of Contents */}
      {toc.length > 0 && (
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-xs font-medium text-muted uppercase tracking-wider mb-3">
            <List size={14} />
            On This Page
          </h3>
          <nav className="space-y-1">
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`block text-sm transition-colors ${
                  activeId === item.id
                    ? "text-accent font-medium"
                    : "text-muted hover:text-text"
                }`}
                style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </div>
      )}

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-xs font-medium text-muted uppercase tracking-wider mb-3">
            <Link size={14} />
            Backlinks
          </h3>
          <div className="space-y-2">
            {backlinks.map((link) => (
              <a
                key={link.slug}
                href={`/docs/${link.slug}`}
                className="block p-2 rounded-md hover:bg-surface transition-colors"
              >
                <span className="text-sm text-text font-medium">{link.title}</span>
                {link.context && (
                  <p className="text-xs text-muted mt-1 line-clamp-2">{link.context}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {toc.length === 0 && backlinks.length === 0 && (
        <p className="text-sm text-muted">No content available</p>
      )}
    </aside>
  );
}
