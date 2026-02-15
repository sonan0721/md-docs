"use client";

import { useState } from "react";
import { ChevronRight, FileText, Folder, Inbox, Tag } from "lucide-react";

interface FolderItem {
  name: string;
  type: "folder" | "file";
  children?: FolderItem[];
  slug?: string;
}

interface SidebarProps {
  folders?: FolderItem[];
  tags?: string[];
}

export function Sidebar({ folders = [], tags = [] }: SidebarProps) {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const renderFolderItem = (item: FolderItem, path: string = "") => {
    const fullPath = path ? `${path}/${item.name}` : item.name;
    const isCollapsed = collapsedFolders.has(fullPath);

    if (item.type === "folder") {
      return (
        <div key={fullPath}>
          <button
            onClick={() => toggleFolder(fullPath)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface transition-colors text-left"
          >
            <ChevronRight
              size={14}
              className={`text-muted transition-transform ${!isCollapsed ? "rotate-90" : ""}`}
            />
            <Folder size={16} className="text-muted" />
            <span className="text-sm text-text truncate">{item.name}</span>
          </button>
          {!isCollapsed && item.children && (
            <div className="ml-4 border-l border-border pl-2">
              {item.children.map((child) => renderFolderItem(child, fullPath))}
            </div>
          )}
        </div>
      );
    }

    return (
      <a
        key={fullPath}
        href={`/docs/${item.slug || fullPath}`}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface transition-colors ml-5"
      >
        <FileText size={16} className="text-muted" />
        <span className="text-sm text-text truncate">{item.name}</span>
      </a>
    );
  };

  return (
    <aside className="w-sidebar h-[calc(100vh-3.5rem)] border-r border-border bg-background overflow-y-auto p-3">
      {/* Inbox Quick Access */}
      <div className="mb-4">
        <a
          href="/inbox"
          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface transition-colors"
        >
          <Inbox size={16} className="text-muted" />
          <span className="text-sm text-text">Inbox</span>
        </a>
      </div>

      {/* Folder Structure */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider px-2 mb-2">
          Documents
        </h3>
        {folders.length > 0 ? (
          <nav>{folders.map((folder) => renderFolderItem(folder))}</nav>
        ) : (
          <p className="text-sm text-muted px-2">No documents yet</p>
        )}
      </div>

      {/* Tags Section */}
      <div>
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider px-2 mb-2">
          Tags
        </h3>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 px-2">
            {tags.map((tag) => (
              <a
                key={tag}
                href={`/tags/${tag}`}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface text-xs text-muted hover:text-text transition-colors"
              >
                <Tag size={12} />
                {tag}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted px-2">No tags yet</p>
        )}
      </div>
    </aside>
  );
}
