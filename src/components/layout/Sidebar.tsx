"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, FileText, Folder, Inbox, Tag } from "lucide-react";
import type { FolderNode } from "@/lib/content";

interface SidebarProps {
  tree?: FolderNode[];
  tags?: string[];
}

export function Sidebar({ tree = [], tags = [] }: SidebarProps) {
  const pathname = usePathname();
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

  const renderTreeNode = (node: FolderNode, path: string = "") => {
    const nodeName = node.name || node.title;
    const fullPath = path ? `${path}/${nodeName}` : nodeName;
    const isCollapsed = collapsedFolders.has(fullPath);

    if (node.type === "folder") {
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
            <span className="text-sm text-text truncate">{node.title}</span>
          </button>
          {!isCollapsed && node.children && (
            <div className="ml-4 border-l border-border pl-2">
              {node.children.map((child) => renderTreeNode(child, fullPath))}
            </div>
          )}
        </div>
      );
    }

    // File node
    const href = `/docs/${node.slug}`;
    const isActive = pathname === href;

    return (
      <Link
        key={node.slug || fullPath}
        href={href}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ml-5 ${
          isActive
            ? "bg-accent/10 text-accent"
            : "hover:bg-surface text-text"
        }`}
      >
        <FileText size={16} className={isActive ? "text-accent" : "text-muted"} />
        <span className="text-sm truncate">{node.title}</span>
      </Link>
    );
  };

  return (
    <aside className="w-sidebar h-[calc(100vh-3.5rem)] border-r border-border bg-background overflow-y-auto p-3">
      {/* Inbox Quick Access */}
      <div className="mb-4">
        <Link
          href="/inbox"
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
            pathname === "/inbox"
              ? "bg-accent/10 text-accent"
              : "hover:bg-surface text-text"
          }`}
        >
          <Inbox size={16} className={pathname === "/inbox" ? "text-accent" : "text-muted"} />
          <span className="text-sm">Inbox</span>
        </Link>
      </div>

      {/* Folder Structure */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider px-2 mb-2">
          Documents
        </h3>
        {tree.length > 0 ? (
          <nav>{tree.map((node) => renderTreeNode(node))}</nav>
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
              <Link
                key={tag}
                href={`/tags/${tag}`}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                  pathname === `/tags/${tag}`
                    ? "bg-accent text-white"
                    : "bg-surface text-muted hover:text-text"
                }`}
              >
                <Tag size={12} />
                {tag}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted px-2">No tags yet</p>
        )}
      </div>
    </aside>
  );
}
