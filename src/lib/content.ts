import type { Document, DocumentFrontmatter } from "@/types";
import { parseMarkdown } from "./markdown";

export interface FolderNode {
  type: "folder" | "file";
  name?: string;
  slug?: string;
  title: string;
  children?: FolderNode[];
}

// Mock raw markdown documents
const mockRawDocuments: { slug: string; path: string; raw: string }[] = [
  {
    slug: "index",
    path: "index.md",
    raw: `---
title: Welcome to MD Docs
tags:
  - documentation
  - welcome
created: "2024-01-01"
updated: "2024-01-15"
public: true
---

# Welcome to MD Docs

This is your personal documentation wiki powered by markdown files stored in GitHub.

## Getting Started

To get started with MD Docs, you can:

1. Create new documents using the editor
2. Organize documents into folders
3. Use tags to categorize your content

## Features

MD Docs supports many powerful features:

- **Markdown Editing**: Full markdown support with live preview
- **Folder Organization**: Organize documents in a hierarchical structure
- **Search**: Full-text search across all documents
- **Tags**: Categorize documents with tags

### BBCode Support

You can also use BBCode for special formatting like spoilers and custom blocks.

## Next Steps

Check out the sample project documentation to see more examples.
`,
  },
  {
    slug: "projects/project-a",
    path: "projects/project-a.md",
    raw: `---
title: Project A Documentation
tags:
  - project
  - example
created: "2024-01-10"
updated: "2024-01-20"
public: false
---

# Project A Documentation

This is the documentation for Project A, a sample project to demonstrate MD Docs capabilities.

## Overview

Project A is a demonstration project that showcases:

- Document organization
- Markdown rendering
- Table of contents generation

## Architecture

The project follows a modular architecture with the following components:

### Frontend

The frontend is built with Next.js and React, providing a modern user experience.

### Backend

The backend integrates with GitHub API for document storage and retrieval.

## Development

To work on this project:

1. Clone the repository
2. Install dependencies with \`npm install\`
3. Run the development server with \`npm run dev\`

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a pull request.
`,
  },
];

// Cache for parsed documents
let parsedDocumentsCache: Document[] | null = null;

/**
 * Parses all mock documents and caches them
 */
async function getParsedDocuments(): Promise<Document[]> {
  if (parsedDocumentsCache) {
    return parsedDocumentsCache;
  }

  const documents: Document[] = [];

  for (const doc of mockRawDocuments) {
    const parsed = await parseMarkdown(doc.raw);
    documents.push({
      slug: doc.slug,
      path: doc.path,
      title: parsed.frontmatter.title,
      content: parsed.content,
      frontmatter: parsed.frontmatter,
    });
  }

  parsedDocumentsCache = documents;
  return documents;
}

/**
 * Gets a document by its slug
 */
export async function getDocumentBySlug(
  slug: string
): Promise<Document | undefined> {
  const documents = await getParsedDocuments();
  return documents.find((doc) => doc.slug === slug);
}

/**
 * Gets all documents
 */
export async function getAllDocuments(): Promise<Document[]> {
  return getParsedDocuments();
}

/**
 * Builds a folder tree structure from documents
 */
export async function getDocumentTree(): Promise<FolderNode[]> {
  const documents = await getParsedDocuments();
  const tree: FolderNode[] = [];

  // Helper to find or create a folder node
  function findOrCreateFolder(
    nodes: FolderNode[],
    folderName: string
  ): FolderNode {
    let folder = nodes.find(
      (n) => n.type === "folder" && n.name === folderName
    );
    if (!folder) {
      folder = {
        type: "folder",
        name: folderName,
        title: folderName.charAt(0).toUpperCase() + folderName.slice(1),
        children: [],
      };
      nodes.push(folder);
    }
    return folder;
  }

  for (const doc of documents) {
    const parts = doc.slug.split("/");

    if (parts.length === 1) {
      // Root level document
      tree.push({
        type: "file",
        slug: doc.slug,
        title: doc.title,
      });
    } else {
      // Nested document - create folder structure
      let currentLevel = tree;
      for (let i = 0; i < parts.length - 1; i++) {
        const folder = findOrCreateFolder(currentLevel, parts[i]);
        currentLevel = folder.children!;
      }

      // Add the document to the final folder
      currentLevel.push({
        type: "file",
        slug: doc.slug,
        title: doc.title,
      });
    }
  }

  return tree;
}

/**
 * Clears the parsed documents cache (useful for testing or refreshing)
 */
export function clearDocumentCache(): void {
  parsedDocumentsCache = null;
}
