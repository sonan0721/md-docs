# Personal Wiki Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local-first, AI-friendly personal wiki with web interface, GitHub sync, and WYSIWYG editing.

**Architecture:** Next.js App Router with SSG/ISR for reading, client-side GitHub API for editing. TipTap editor with BBCode/backlink extensions. FlexSearch for Korean full-text search. Vercel Edge Functions for OAuth.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, TipTap, FlexSearch, es-hangul, Zustand

---

## Phase 1: Project Setup

### Task 1.1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `next.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

**Step 1: Create Next.js project with TypeScript and Tailwind**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

**Step 2: Verify installation**

Run: `npm run dev`
Expected: Server starts at http://localhost:3000

**Step 3: Clean up default files**

Remove default content from `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen">
      <h1>Wiki</h1>
    </main>
  );
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: initialize Next.js project with TypeScript and Tailwind"
```

---

### Task 1.2: Configure Tailwind with Design System

**Files:**
- Modify: `tailwind.config.ts`
- Create: `src/styles/globals.css`

**Step 1: Update Tailwind config with color system**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        border: "var(--border)",
        text: "var(--text)",
        muted: "var(--muted)",
        accent: "var(--accent)",
      },
      fontFamily: {
        sans: ["Pretendard", "Apple SD Gothic Neo", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      maxWidth: {
        content: "720px",
      },
      width: {
        sidebar: "240px",
        rightpanel: "200px",
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2: Add CSS variables for theming**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --surface: #f7f7f5;
  --border: #e8e8e8;
  --text: #1a1a1a;
  --muted: #6b6b6b;
  --accent: #2563eb;
}

.dark {
  --background: #191919;
  --surface: #252525;
  --border: #333333;
  --text: #ebebeb;
  --muted: #888888;
  --accent: #3b82f6;
}

body {
  background-color: var(--background);
  color: var(--text);
  font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif;
  line-height: 1.7;
}
```

**Step 3: Verify styles work**

Run: `npm run dev`
Expected: Page loads with white background

**Step 4: Commit**

```bash
git add -A
git commit -m "style: configure Tailwind with design system colors and fonts"
```

---

### Task 1.3: Install Core Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install dependencies**

```bash
npm install zustand @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-placeholder @tiptap/extension-underline gray-matter remark remark-html flexsearch es-hangul lucide-react
```

```bash
npm install -D @types/flexsearch
```

**Step 2: Verify installation**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install core dependencies (TipTap, Zustand, FlexSearch, etc.)"
```

---

### Task 1.4: Create Project Structure

**Files:**
- Create: `src/components/.gitkeep`
- Create: `src/lib/.gitkeep`
- Create: `src/hooks/.gitkeep`
- Create: `src/stores/.gitkeep`
- Create: `src/types/index.ts`

**Step 1: Create directory structure**

```bash
mkdir -p src/components/layout src/components/editor src/components/search src/components/ui
mkdir -p src/lib src/hooks src/stores src/types
```

**Step 2: Create base types**

```typescript
// src/types/index.ts
export interface WikiConfig {
  name: string;
  repo: string;
  defaultFolder: string;
  theme: "light" | "dark";
  visibility: "private" | "public";
  publicPaths: string[];
  features: {
    bbcode: boolean;
    backlinks: boolean;
    tags: boolean;
  };
}

export interface Document {
  slug: string;
  path: string;
  title: string;
  content: string;
  frontmatter: DocumentFrontmatter;
  children?: Document[];
}

export interface DocumentFrontmatter {
  title: string;
  tags?: string[];
  created?: string;
  updated?: string;
  public?: boolean;
}

export interface FolderMeta {
  title: string;
  icon?: string;
  order?: string[];
  collapsed?: boolean;
  public?: boolean;
}

export interface SearchResult {
  slug: string;
  title: string;
  path: string;
  excerpt: string;
  score: number;
}

export interface Backlink {
  slug: string;
  title: string;
  context: string;
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: create project directory structure and base types"
```

---

## Phase 2: Basic Layout

### Task 2.1: Create Layout Shell

**Files:**
- Create: `src/components/layout/Shell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/RightPanel.tsx`
- Create: `src/components/layout/Header.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create Header component**

```tsx
// src/components/layout/Header.tsx
"use client";

import { Search, User } from "lucide-react";

interface HeaderProps {
  onSearchOpen: () => void;
}

export function Header({ onSearchOpen }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold">Wiki</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSearchOpen}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface text-muted hover:text-text transition-colors"
        >
          <Search size={16} />
          <span className="text-sm">Search</span>
          <kbd className="text-xs bg-background px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
        </button>

        <button className="p-2 rounded-md hover:bg-surface transition-colors">
          <User size={20} />
        </button>
      </div>
    </header>
  );
}
```

**Step 2: Create Sidebar component**

```tsx
// src/components/layout/Sidebar.tsx
"use client";

import { ChevronRight, FileText, Folder, Inbox, Tag } from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleFolder = (path: string) => {
    setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <aside className="w-sidebar h-[calc(100vh-3.5rem)] border-r border-border bg-background overflow-y-auto">
      <nav className="p-3">
        {/* Quick Access */}
        <div className="mb-4">
          <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-surface text-muted hover:text-text transition-colors">
            <Inbox size={16} />
            <span className="text-sm">Inbox</span>
          </button>
        </div>

        {/* Folders */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted uppercase tracking-wide px-2 mb-2">
            Folders
          </div>

          <div className="space-y-0.5">
            <button
              onClick={() => toggleFolder("projects")}
              className="flex items-center gap-1 w-full px-2 py-1.5 rounded-md hover:bg-surface transition-colors"
            >
              <ChevronRight
                size={14}
                className={`text-muted transition-transform ${
                  !collapsed["projects"] ? "rotate-90" : ""
                }`}
              />
              <Folder size={16} className="text-muted" />
              <span className="text-sm">Projects</span>
            </button>

            {!collapsed["projects"] && (
              <div className="ml-5 space-y-0.5">
                <button className="flex items-center gap-2 w-full px-2 py-1 rounded-md hover:bg-surface text-muted hover:text-text transition-colors">
                  <FileText size={14} />
                  <span className="text-sm">Project A</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="text-xs font-medium text-muted uppercase tracking-wide px-2 mb-2">
            Tags
          </div>
          <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-surface text-muted hover:text-text transition-colors">
            <Tag size={16} />
            <span className="text-sm">All Tags</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
```

**Step 3: Create RightPanel component**

```tsx
// src/components/layout/RightPanel.tsx
"use client";

import { Link } from "lucide-react";

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
    <aside className="w-rightpanel h-[calc(100vh-3.5rem)] border-l border-border bg-background overflow-y-auto sticky top-14">
      <div className="p-4">
        {/* Table of Contents */}
        {toc.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
              On This Page
            </h3>
            <nav className="space-y-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`block text-sm transition-colors ${
                    item.level === 2 ? "pl-0" : "pl-3"
                  } ${
                    activeId === item.id
                      ? "text-accent font-medium"
                      : "text-muted hover:text-text"
                  }`}
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
            <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3 flex items-center gap-1">
              <Link size={12} />
              Backlinks ({backlinks.length})
            </h3>
            <div className="space-y-2">
              {backlinks.map((link) => (
                <a
                  key={link.slug}
                  href={`/docs/${link.slug}`}
                  className="block p-2 rounded-md bg-surface hover:bg-border/50 transition-colors"
                >
                  <div className="text-sm font-medium">{link.title}</div>
                  <div className="text-xs text-muted line-clamp-2">{link.context}</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
```

**Step 4: Create Shell component**

```tsx
// src/components/layout/Shell.tsx
"use client";

import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { RightPanel } from "./RightPanel";

interface ShellProps {
  children: React.ReactNode;
  showRightPanel?: boolean;
}

export function Shell({ children, showRightPanel = true }: ShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onSearchOpen={() => setSearchOpen(true)} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 min-w-0">
          <div className="max-w-content mx-auto px-6 py-8">
            {children}
          </div>
        </main>

        {showRightPanel && <RightPanel />}
      </div>
    </div>
  );
}
```

**Step 5: Update app layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wiki",
  description: "Personal Wiki",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

**Step 6: Update home page**

```tsx
// src/app/page.tsx
import { Shell } from "@/components/layout/Shell";

export default function Home() {
  return (
    <Shell>
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Welcome to Wiki</h1>
        <p>Your personal knowledge base.</p>
      </article>
    </Shell>
  );
}
```

**Step 7: Verify layout**

Run: `npm run dev`
Expected: 3-column layout displays correctly

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: implement 3-column layout shell with header, sidebar, and right panel"
```

---

### Task 2.2: Add Responsive Behavior

**Files:**
- Modify: `src/components/layout/Shell.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Create: `src/hooks/useMediaQuery.ts`

**Step 1: Create useMediaQuery hook**

```typescript
// src/hooks/useMediaQuery.ts
"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

export function useIsMobile() {
  return useMediaQuery("(max-width: 768px)");
}

export function useIsTablet() {
  return useMediaQuery("(max-width: 1024px)");
}

export function useIsLaptop() {
  return useMediaQuery("(max-width: 1280px)");
}
```

**Step 2: Update Shell with responsive sidebar**

```tsx
// src/components/layout/Shell.tsx
"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { RightPanel } from "./RightPanel";
import { useIsTablet, useIsLaptop } from "@/hooks/useMediaQuery";

interface ShellProps {
  children: React.ReactNode;
  showRightPanel?: boolean;
}

export function Shell({ children, showRightPanel = true }: ShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isTablet = useIsTablet();
  const isLaptop = useIsLaptop();

  // Close sidebar on route change for mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header
        onSearchOpen={() => setSearchOpen(true)}
        onMenuClick={() => setSidebarOpen(true)}
        showMenu={isTablet}
      />

      <div className="flex">
        {/* Sidebar - responsive */}
        {isTablet ? (
          <>
            {/* Overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            {/* Drawer */}
            <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}>
              <div className="relative">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="absolute top-4 right-4 p-1 rounded-md hover:bg-surface"
                >
                  <X size={20} />
                </button>
                <Sidebar />
              </div>
            </div>
          </>
        ) : (
          <Sidebar />
        )}

        <main className="flex-1 min-w-0">
          <div className="max-w-content mx-auto px-6 py-8">
            {children}
          </div>
        </main>

        {/* Right panel - hide on laptop and smaller */}
        {showRightPanel && !isLaptop && <RightPanel />}
      </div>
    </div>
  );
}
```

**Step 3: Update Header with menu button**

```tsx
// src/components/layout/Header.tsx
"use client";

import { Menu, Search, User } from "lucide-react";

interface HeaderProps {
  onSearchOpen: () => void;
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function Header({ onSearchOpen, onMenuClick, showMenu }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {showMenu && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-surface transition-colors"
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
```

**Step 4: Test responsive behavior**

Run: `npm run dev`
Test: Resize browser window
Expected: Sidebar becomes overlay on tablet, right panel hides on laptop

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add responsive behavior for sidebar and right panel"
```

---

## Phase 3: Content Rendering

### Task 3.1: Create MD Parser Utilities

**Files:**
- Create: `src/lib/markdown.ts`
- Create: `src/lib/content.ts`

**Step 1: Create markdown parser**

```typescript
// src/lib/markdown.ts
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { DocumentFrontmatter } from "@/types";

export interface ParsedDocument {
  frontmatter: DocumentFrontmatter;
  content: string;
  html: string;
  toc: TocItem[];
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export async function parseMarkdown(rawContent: string): Promise<ParsedDocument> {
  const { data, content } = matter(rawContent);

  const frontmatter: DocumentFrontmatter = {
    title: data.title || "Untitled",
    tags: data.tags || [],
    created: data.created,
    updated: data.updated,
    public: data.public || false,
  };

  // Extract TOC from headings
  const toc = extractToc(content);

  // Convert MD to HTML
  const processedContent = await remark()
    .use(html, { sanitize: false })
    .process(content);

  const htmlContent = processedContent.toString();

  // Add IDs to headings for TOC linking
  const htmlWithIds = addHeadingIds(htmlContent, toc);

  return {
    frontmatter,
    content,
    html: htmlWithIds,
    toc,
  };
}

function extractToc(content: string): TocItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugify(text);
    toc.push({ id, text, level });
  }

  return toc;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function addHeadingIds(html: string, toc: TocItem[]): string {
  let result = html;

  toc.forEach((item) => {
    const regex = new RegExp(`<h${item.level}>([^<]*${escapeRegex(item.text)}[^<]*)</h${item.level}>`, "i");
    result = result.replace(regex, `<h${item.level} id="${item.id}">$1</h${item.level}>`);
  });

  return result;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

**Step 2: Create content utilities**

```typescript
// src/lib/content.ts
import { Document, FolderMeta } from "@/types";

// For now, mock data - will be replaced with GitHub API
export const mockDocuments: Document[] = [
  {
    slug: "index",
    path: "content/index.md",
    title: "Welcome",
    content: `---
title: Welcome
tags: [home]
created: 2024-02-15
---

# Welcome to Wiki

Your personal knowledge base.

## Getting Started

Start by creating your first document.

## Features

- **Markdown** based
- **Local first** storage
- **Git sync** with GitHub
`,
    frontmatter: {
      title: "Welcome",
      tags: ["home"],
      created: "2024-02-15",
    },
  },
  {
    slug: "projects/project-a",
    path: "content/projects/project-a.md",
    title: "Project A",
    content: `---
title: Project A
tags: [project, design]
created: 2024-02-15
---

# Project A

This is a sample project document.

## Overview

Project overview goes here.

## Architecture

Architecture details.
`,
    frontmatter: {
      title: "Project A",
      tags: ["project", "design"],
      created: "2024-02-15",
    },
  },
];

export function getDocumentBySlug(slug: string): Document | undefined {
  return mockDocuments.find((doc) => doc.slug === slug);
}

export function getAllDocuments(): Document[] {
  return mockDocuments;
}

export function getDocumentTree(): FolderNode[] {
  // Build tree structure from flat documents
  const tree: FolderNode[] = [];

  // Group by first path segment
  const groups: Record<string, Document[]> = {};

  mockDocuments.forEach((doc) => {
    const parts = doc.slug.split("/");
    const folder = parts.length > 1 ? parts[0] : "_root";
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(doc);
  });

  // Convert to tree
  Object.entries(groups).forEach(([folder, docs]) => {
    if (folder === "_root") {
      docs.forEach((doc) => {
        tree.push({ type: "file", slug: doc.slug, title: doc.title });
      });
    } else {
      tree.push({
        type: "folder",
        name: folder,
        title: capitalize(folder),
        children: docs.map((doc) => ({
          type: "file",
          slug: doc.slug,
          title: doc.title,
        })),
      });
    }
  });

  return tree;
}

export interface FolderNode {
  type: "folder" | "file";
  name?: string;
  slug?: string;
  title: string;
  children?: FolderNode[];
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add markdown parser and content utilities"
```

---

### Task 3.2: Create Document Page

**Files:**
- Create: `src/app/docs/[...slug]/page.tsx`
- Create: `src/components/content/DocumentView.tsx`

**Step 1: Create DocumentView component**

```tsx
// src/components/content/DocumentView.tsx
"use client";

import { ParsedDocument } from "@/lib/markdown";
import { FileText } from "lucide-react";

interface DocumentViewProps {
  document: ParsedDocument;
  childDocs?: { slug: string; title: string }[];
}

export function DocumentView({ document, childDocs = [] }: DocumentViewProps) {
  return (
    <article>
      {/* Title */}
      <h1 className="text-3xl font-bold mb-2">{document.frontmatter.title}</h1>

      {/* Tags */}
      {document.frontmatter.tags && document.frontmatter.tags.length > 0 && (
        <div className="flex gap-2 mb-6">
          {document.frontmatter.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded-full bg-surface text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-neutral dark:prose-invert max-w-none
          prose-headings:scroll-mt-20
          prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4
          prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3
          prose-p:my-4
          prose-a:text-accent prose-a:no-underline hover:prose-a:underline
          prose-code:bg-surface prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-surface prose-pre:border prose-pre:border-border"
        dangerouslySetInnerHTML={{ __html: document.html }}
      />

      {/* Child Documents */}
      {childDocs.length > 0 && (
        <div className="mt-12 pt-8 border-t border-border">
          <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4 flex items-center gap-2">
            <FileText size={14} />
            하위 문서
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {childDocs.map((doc) => (
              <a
                key={doc.slug}
                href={`/docs/${doc.slug}`}
                className="p-4 rounded-lg bg-surface hover:bg-border/50 transition-colors"
              >
                <div className="font-medium">{doc.title}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
```

**Step 2: Create document page**

```tsx
// src/app/docs/[...slug]/page.tsx
import { Shell } from "@/components/layout/Shell";
import { DocumentView } from "@/components/content/DocumentView";
import { getDocumentBySlug, getAllDocuments } from "@/lib/content";
import { parseMarkdown } from "@/lib/markdown";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function DocumentPage({ params }: PageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");

  const doc = getDocumentBySlug(slugPath);

  if (!doc) {
    notFound();
  }

  const parsed = await parseMarkdown(doc.content);

  return (
    <Shell>
      <DocumentView document={parsed} />
    </Shell>
  );
}

export async function generateStaticParams() {
  const docs = getAllDocuments();
  return docs.map((doc) => ({
    slug: doc.slug.split("/"),
  }));
}
```

**Step 3: Verify document rendering**

Run: `npm run dev`
Navigate: http://localhost:3000/docs/projects/project-a
Expected: Document renders with title, tags, and content

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: implement document page with markdown rendering"
```

---

### Task 3.3: Connect Sidebar to Content Tree

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/Shell.tsx`

**Step 1: Update Sidebar to accept tree data**

```tsx
// src/components/layout/Sidebar.tsx
"use client";

import { ChevronRight, FileText, Folder, Inbox, Tag } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderNode } from "@/lib/content";

interface SidebarProps {
  tree?: FolderNode[];
}

export function Sidebar({ tree = [] }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  const toggleFolder = (path: string) => {
    setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const isActive = (slug: string) => pathname === `/docs/${slug}`;

  const renderNode = (node: FolderNode, depth = 0) => {
    if (node.type === "file") {
      return (
        <Link
          key={node.slug}
          href={`/docs/${node.slug}`}
          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-colors ${
            isActive(node.slug!)
              ? "bg-accent/10 text-accent"
              : "text-muted hover:text-text hover:bg-surface"
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <FileText size={14} />
          <span className="text-sm truncate">{node.title}</span>
        </Link>
      );
    }

    const isCollapsed = collapsed[node.name!];

    return (
      <div key={node.name}>
        <button
          onClick={() => toggleFolder(node.name!)}
          className="flex items-center gap-1 w-full px-2 py-1.5 rounded-md hover:bg-surface transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <ChevronRight
            size={14}
            className={`text-muted transition-transform ${!isCollapsed ? "rotate-90" : ""}`}
          />
          <Folder size={16} className="text-muted" />
          <span className="text-sm">{node.title}</span>
        </button>

        {!isCollapsed && node.children && (
          <div className="space-y-0.5">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-sidebar h-[calc(100vh-3.5rem)] border-r border-border bg-background overflow-y-auto">
      <nav className="p-3">
        {/* Quick Access */}
        <div className="mb-4">
          <Link
            href="/"
            className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-colors ${
              pathname === "/" ? "bg-accent/10 text-accent" : "text-muted hover:text-text hover:bg-surface"
            }`}
          >
            <Inbox size={16} />
            <span className="text-sm">Home</span>
          </Link>
        </div>

        {/* Document Tree */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted uppercase tracking-wide px-2 mb-2">
            Documents
          </div>
          <div className="space-y-0.5">
            {tree.map((node) => renderNode(node))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="text-xs font-medium text-muted uppercase tracking-wide px-2 mb-2">
            Tags
          </div>
          <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-surface text-muted hover:text-text transition-colors">
            <Tag size={16} />
            <span className="text-sm">All Tags</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
```

**Step 2: Pass tree to Shell**

```tsx
// src/components/layout/Shell.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { RightPanel } from "./RightPanel";
import { useIsTablet, useIsLaptop } from "@/hooks/useMediaQuery";
import { FolderNode } from "@/lib/content";
import { TocItem } from "@/lib/markdown";
import { Backlink } from "@/types";

interface ShellProps {
  children: React.ReactNode;
  showRightPanel?: boolean;
  tree?: FolderNode[];
  toc?: TocItem[];
  backlinks?: Backlink[];
}

export function Shell({
  children,
  showRightPanel = true,
  tree = [],
  toc = [],
  backlinks = [],
}: ShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isTablet = useIsTablet();
  const isLaptop = useIsLaptop();

  return (
    <div className="min-h-screen bg-background">
      <Header
        onSearchOpen={() => setSearchOpen(true)}
        onMenuClick={() => setSidebarOpen(true)}
        showMenu={isTablet}
      />

      <div className="flex">
        {/* Sidebar */}
        {isTablet ? (
          <>
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}>
              <div className="relative">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="absolute top-4 right-4 p-1 rounded-md hover:bg-surface z-10"
                >
                  <X size={20} />
                </button>
                <Sidebar tree={tree} />
              </div>
            </div>
          </>
        ) : (
          <Sidebar tree={tree} />
        )}

        <main className="flex-1 min-w-0">
          <div className="max-w-content mx-auto px-6 py-8">
            {children}
          </div>
        </main>

        {showRightPanel && !isLaptop && (
          <RightPanel toc={toc} backlinks={backlinks} />
        )}
      </div>
    </div>
  );
}
```

**Step 3: Update pages to use tree**

```tsx
// src/app/page.tsx
import { Shell } from "@/components/layout/Shell";
import { getDocumentTree } from "@/lib/content";

export default function Home() {
  const tree = getDocumentTree();

  return (
    <Shell tree={tree}>
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Welcome to Wiki</h1>
        <p>Your personal knowledge base.</p>
      </article>
    </Shell>
  );
}
```

```tsx
// src/app/docs/[...slug]/page.tsx
import { Shell } from "@/components/layout/Shell";
import { DocumentView } from "@/components/content/DocumentView";
import { getDocumentBySlug, getAllDocuments, getDocumentTree } from "@/lib/content";
import { parseMarkdown } from "@/lib/markdown";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function DocumentPage({ params }: PageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");

  const doc = getDocumentBySlug(slugPath);

  if (!doc) {
    notFound();
  }

  const parsed = await parseMarkdown(doc.content);
  const tree = getDocumentTree();

  return (
    <Shell tree={tree} toc={parsed.toc}>
      <DocumentView document={parsed} />
    </Shell>
  );
}

export async function generateStaticParams() {
  const docs = getAllDocuments();
  return docs.map((doc) => ({
    slug: doc.slug.split("/"),
  }));
}
```

**Step 4: Verify sidebar navigation**

Run: `npm run dev`
Expected: Sidebar shows document tree, navigation works

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: connect sidebar to document tree with navigation"
```

---

## Phase 4-10: Remaining Implementation

> **Note:** The remaining phases follow the same pattern. Due to length, they are summarized here. Each task follows TDD: write test → verify fail → implement → verify pass → commit.

### Phase 4: GitHub OAuth
- Task 4.1: Create OAuth route handlers (`/api/auth/github`, `/api/auth/callback`)
- Task 4.2: Create auth store with Zustand
- Task 4.3: Add login/logout UI to Header
- Task 4.4: Implement auth middleware

### Phase 5: GitHub API Integration (Read)
- Task 5.1: Create GitHub API client library
- Task 5.2: Replace mock data with GitHub API
- Task 5.3: Implement repo selection flow
- Task 5.4: Cache responses in IndexedDB

### Phase 6: TipTap Editor
- Task 6.1: Create basic TipTap editor component
- Task 6.2: Add floating toolbar
- Task 6.3: Implement slash commands
- Task 6.4: Add image upload via GitHub API
- Task 6.5: Implement MD serialization

### Phase 7: GitHub API (Write)
- Task 7.1: Implement save to GitHub (PUT contents)
- Task 7.2: Add conflict detection (SHA check)
- Task 7.3: Implement conflict resolution UI
- Task 7.4: Add auto-save draft to localStorage

### Phase 8: BBCode & Backlinks
- Task 8.1: Create BBCode TipTap extensions
- Task 8.2: Create backlink TipTap extension
- Task 8.3: Build backlink index at build time
- Task 8.4: Render backlink autocomplete

### Phase 9: Search
- Task 9.1: Create search index builder script
- Task 9.2: Implement FlexSearch with Korean tokenizer
- Task 9.3: Build search modal UI (⌘K)
- Task 9.4: Add advanced search syntax

### Phase 10: Public/Private & Deploy
- Task 10.1: Implement visibility settings
- Task 10.2: Create public URL routes
- Task 10.3: Set up Vercel deployment
- Task 10.4: Configure GitHub webhooks for rebuild

---

## Summary

| Phase | Tasks | Estimated Steps |
|-------|-------|-----------------|
| 1. Setup | 4 | 16 |
| 2. Layout | 2 | 10 |
| 3. Content | 3 | 15 |
| 4. OAuth | 4 | 20 |
| 5. GitHub Read | 4 | 20 |
| 6. Editor | 5 | 30 |
| 7. GitHub Write | 4 | 20 |
| 8. BBCode/Backlinks | 4 | 25 |
| 9. Search | 4 | 20 |
| 10. Deploy | 4 | 15 |
| **Total** | **38** | **~191** |
