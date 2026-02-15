import fs from "fs";
import path from "path";
import type { Document } from "@/types";
import { parseMarkdown } from "./markdown";

export interface FolderNode {
  type: "folder" | "file";
  name?: string;
  slug?: string;
  title: string;
  children?: FolderNode[];
}

const CONTENT_DIR = path.join(process.cwd(), "content");

/**
 * Recursively finds all .md files in a directory
 */
function findMarkdownFiles(dir: string, basePath: string = ""): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(path.join(dir, entry.name), relativePath));
    } else if (entry.name.endsWith(".md")) {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Converts a file path to a slug
 * e.g., "projects/project-a.md" -> "projects/project-a"
 *       "index.md" -> "index"
 */
function pathToSlug(filePath: string): string {
  return filePath.replace(/\.md$/, "");
}

/**
 * Gets a document by its slug
 */
export async function getDocumentBySlug(
  slug: string
): Promise<Document | undefined> {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = await parseMarkdown(raw);

  return {
    slug,
    path: `${slug}.md`,
    title: parsed.frontmatter.title,
    content: parsed.content,
    frontmatter: parsed.frontmatter,
  };
}

/**
 * Gets all documents
 */
export async function getAllDocuments(): Promise<Document[]> {
  const files = findMarkdownFiles(CONTENT_DIR);
  const documents: Document[] = [];

  for (const file of files) {
    const slug = pathToSlug(file);
    const doc = await getDocumentBySlug(slug);
    if (doc) {
      documents.push(doc);
    }
  }

  return documents;
}

/**
 * Builds a folder tree structure from documents
 */
export async function getDocumentTree(): Promise<FolderNode[]> {
  const documents = await getAllDocuments();
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
 * Gets child documents for a given slug (documents in subdirectory)
 */
export async function getChildDocuments(
  slug: string
): Promise<{ slug: string; title: string }[]> {
  const documents = await getAllDocuments();
  const prefix = slug + "/";

  return documents
    .filter((doc) => doc.slug.startsWith(prefix))
    .map((doc) => ({
      slug: doc.slug,
      title: doc.title,
    }));
}
