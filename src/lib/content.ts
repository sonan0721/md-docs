import fs from "fs";
import path from "path";
import type { Document, GitHubContent } from "@/types";
import { parseMarkdown } from "./markdown";
import { fetchRepoContents, fetchFileContent } from "./github";

export interface FolderNode {
  type: "folder" | "file";
  name?: string;
  slug?: string;
  title: string;
  children?: FolderNode[];
}

export interface GitHubContext {
  token: string;
  owner: string;
  repo: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content");

// ============================================
// Local File System Functions (Fallback)
// ============================================

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
 * Gets a document by its slug from local filesystem
 */
async function getLocalDocumentBySlug(
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
 * Gets all documents from local filesystem
 */
async function getLocalAllDocuments(): Promise<Document[]> {
  const files = findMarkdownFiles(CONTENT_DIR);
  const documents: Document[] = [];

  for (const file of files) {
    const slug = pathToSlug(file);
    const doc = await getLocalDocumentBySlug(slug);
    if (doc) {
      documents.push(doc);
    }
  }

  return documents;
}

// ============================================
// GitHub API Functions
// ============================================

/**
 * Recursively finds all .md files in a GitHub repository
 */
async function findGitHubMarkdownFiles(
  ctx: GitHubContext,
  path: string = "",
  basePath: string = ""
): Promise<string[]> {
  const files: string[] = [];

  try {
    const contents = await fetchRepoContents(ctx.token, ctx.owner, ctx.repo, path || undefined);

    for (const item of contents) {
      const relativePath = basePath ? `${basePath}/${item.name}` : item.name;

      if (item.type === "dir") {
        const subFiles = await findGitHubMarkdownFiles(ctx, item.path, relativePath);
        files.push(...subFiles);
      } else if (item.name.endsWith(".md")) {
        files.push(relativePath);
      }
    }
  } catch (err) {
    console.error(`Failed to fetch contents at path "${path}":`, err);
  }

  return files;
}

/**
 * Gets a document by its slug from GitHub
 */
async function getGitHubDocumentBySlug(
  ctx: GitHubContext,
  slug: string
): Promise<Document | undefined> {
  try {
    const filePath = `${slug}.md`;
    const { content: raw } = await fetchFileContent(
      ctx.token,
      ctx.owner,
      ctx.repo,
      filePath
    );

    const parsed = await parseMarkdown(raw);

    return {
      slug,
      path: filePath,
      title: parsed.frontmatter.title,
      content: parsed.content,
      frontmatter: parsed.frontmatter,
    };
  } catch (err) {
    console.error(`Failed to fetch document "${slug}" from GitHub:`, err);
    return undefined;
  }
}

/**
 * Gets all documents from GitHub repository
 */
async function getGitHubAllDocuments(ctx: GitHubContext): Promise<Document[]> {
  const files = await findGitHubMarkdownFiles(ctx);
  const documents: Document[] = [];

  for (const file of files) {
    const slug = pathToSlug(file);
    const doc = await getGitHubDocumentBySlug(ctx, slug);
    if (doc) {
      documents.push(doc);
    }
  }

  return documents;
}

// ============================================
// Public API (with GitHub context support)
// ============================================

/**
 * Gets a document by its slug
 * Uses GitHub API if context is provided, otherwise falls back to local filesystem
 */
export async function getDocumentBySlug(
  slug: string,
  githubContext?: GitHubContext
): Promise<Document | undefined> {
  if (githubContext) {
    return getGitHubDocumentBySlug(githubContext, slug);
  }
  return getLocalDocumentBySlug(slug);
}

/**
 * Gets all documents
 * Uses GitHub API if context is provided, otherwise falls back to local filesystem
 */
export async function getAllDocuments(
  githubContext?: GitHubContext
): Promise<Document[]> {
  if (githubContext) {
    return getGitHubAllDocuments(githubContext);
  }
  return getLocalAllDocuments();
}

/**
 * Builds a folder tree structure from documents
 */
export async function getDocumentTree(
  githubContext?: GitHubContext
): Promise<FolderNode[]> {
  const documents = await getAllDocuments(githubContext);
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
  slug: string,
  githubContext?: GitHubContext
): Promise<{ slug: string; title: string }[]> {
  const documents = await getAllDocuments(githubContext);
  const prefix = slug + "/";

  return documents
    .filter((doc) => doc.slug.startsWith(prefix))
    .map((doc) => ({
      slug: doc.slug,
      title: doc.title,
    }));
}

/**
 * Fetches markdown files list from GitHub (for use by client-side APIs)
 */
export async function getGitHubMarkdownFiles(
  ctx: GitHubContext
): Promise<GitHubContent[]> {
  const allFiles: GitHubContent[] = [];

  async function traverse(path: string = "") {
    const contents = await fetchRepoContents(ctx.token, ctx.owner, ctx.repo, path || undefined);

    for (const item of contents) {
      if (item.type === "dir") {
        await traverse(item.path);
      } else if (item.name.endsWith(".md")) {
        allFiles.push(item);
      }
    }
  }

  await traverse();
  return allFiles;
}
