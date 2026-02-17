import fs from "fs";
import path from "path";
import type { Document, FolderMeta } from "@/types";

/**
 * Visibility utilities for document access control.
 * Documents can be private (default) or public.
 *
 * Visibility is determined by:
 * 1. Document frontmatter: `public: true`
 * 2. Folder-level _folder.json: `{ "public": true }`
 *
 * Document-level settings override folder-level settings.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");

/**
 * Gets folder metadata from _folder.json if it exists
 */
function getFolderMeta(folderPath: string): FolderMeta | null {
  const metaPath = path.join(CONTENT_DIR, folderPath, "_folder.json");

  if (!fs.existsSync(metaPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(metaPath, "utf-8");
    return JSON.parse(content) as FolderMeta;
  } catch {
    return null;
  }
}

/**
 * Checks if a folder is marked as public via _folder.json
 */
function isFolderPublic(folderPath: string): boolean {
  const meta = getFolderMeta(folderPath);
  return meta?.public === true;
}

/**
 * Gets the folder path from a document slug
 * e.g., "projects/project-a" -> "projects"
 *       "readme" -> ""
 */
function getDocumentFolder(slug: string): string {
  const parts = slug.split("/");
  if (parts.length <= 1) {
    return "";
  }
  return parts.slice(0, -1).join("/");
}

/**
 * Checks if a document is public.
 *
 * A document is public if:
 * 1. Its frontmatter has `public: true`, OR
 * 2. Its containing folder has `public: true` in _folder.json
 *    (unless the document explicitly sets `public: false`)
 *
 * @param doc - The document to check
 * @returns true if the document is publicly accessible
 */
export function isDocumentPublic(doc: Document): boolean {
  // Check document-level setting first (takes precedence)
  if (doc.frontmatter.public !== undefined) {
    return doc.frontmatter.public === true;
  }

  // Fall back to folder-level setting
  const folderPath = getDocumentFolder(doc.slug);
  if (folderPath) {
    return isFolderPublic(folderPath);
  }

  // Default to private
  return false;
}

/**
 * Checks if a user can access a document.
 *
 * @param doc - The document to check access for
 * @param isAuthenticated - Whether the user is authenticated
 * @returns true if the user can access the document
 */
export function canAccessDocument(
  doc: Document,
  isAuthenticated: boolean
): boolean {
  // Authenticated users can access everything
  if (isAuthenticated) {
    return true;
  }

  // Unauthenticated users can only access public documents
  return isDocumentPublic(doc);
}

/**
 * Filters a list of documents to only include public ones.
 *
 * @param docs - Array of documents to filter
 * @returns Array of only public documents
 */
export function filterPublicDocuments(docs: Document[]): Document[] {
  return docs.filter((doc) => isDocumentPublic(doc));
}

/**
 * Filters backlinks to only include those from public documents.
 * Useful when displaying backlinks on a public page.
 *
 * @param backlinks - Array of backlink slugs/references
 * @param allDocs - All documents to check visibility against
 * @returns Array of backlinks from public documents only
 */
export function filterPublicBacklinks(
  backlinks: { slug: string; title: string; context: string }[],
  allDocs: Document[]
): { slug: string; title: string; context: string }[] {
  const publicSlugs = new Set(
    filterPublicDocuments(allDocs).map((doc) => doc.slug)
  );

  return backlinks.filter((backlink) => publicSlugs.has(backlink.slug));
}

/**
 * Generates a public URL for a document.
 *
 * @param slug - The document slug
 * @returns The public URL path (/p/{slug})
 */
export function getPublicUrl(slug: string): string {
  return `/p/${slug}`;
}

/**
 * Gets visibility info for display purposes.
 *
 * @param doc - The document to get visibility info for
 * @returns Object with visibility status and display properties
 */
export function getVisibilityInfo(doc: Document): {
  isPublic: boolean;
  label: string;
  icon: "lock" | "globe";
  publicUrl: string | null;
} {
  const isPublic = isDocumentPublic(doc);

  return {
    isPublic,
    label: isPublic ? "Public" : "Private",
    icon: isPublic ? "globe" : "lock",
    publicUrl: isPublic ? getPublicUrl(doc.slug) : null,
  };
}
