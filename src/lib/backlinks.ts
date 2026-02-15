/**
 * Backlinks Parser and Indexer
 * Handles wiki-style [[page]] links
 */

import type { Document, Backlink } from "@/types";
import { slugify } from "./markdown";

/**
 * Regex pattern to match wiki-style backlinks [[page name]]
 */
const BACKLINK_PATTERN = /\[\[([^\]]+)\]\]/g;

/**
 * Extract backlinks from markdown content
 * @param content - Markdown content containing [[page]] links
 * @returns Array of page names referenced in backlinks
 */
export function extractBacklinks(content: string): string[] {
  const backlinks: string[] = [];
  let match;

  // Reset regex lastIndex to ensure we start from beginning
  BACKLINK_PATTERN.lastIndex = 0;

  while ((match = BACKLINK_PATTERN.exec(content)) !== null) {
    const linkText = match[1].trim();
    if (linkText && !backlinks.includes(linkText)) {
      backlinks.push(linkText);
    }
  }

  return backlinks;
}

/**
 * Find a document by title or slug
 * @param title - Title to search for
 * @param allDocs - All documents
 * @returns Matching document or undefined
 */
function findDocumentByTitle(
  title: string,
  allDocs: { slug: string; title: string }[]
): { slug: string; title: string } | undefined {
  const normalizedTitle = title.toLowerCase().trim();
  const slugifiedTitle = slugify(title);

  // First, try exact title match
  const exactMatch = allDocs.find(
    (doc) => doc.title.toLowerCase().trim() === normalizedTitle
  );
  if (exactMatch) return exactMatch;

  // Then try slug match
  const slugMatch = allDocs.find(
    (doc) =>
      doc.slug === slugifiedTitle ||
      doc.slug.endsWith("/" + slugifiedTitle)
  );
  if (slugMatch) return slugMatch;

  // Try partial slug match (for nested paths)
  const partialMatch = allDocs.find((doc) => {
    const docSlugParts = doc.slug.split("/");
    const lastPart = docSlugParts[docSlugParts.length - 1];
    return lastPart === slugifiedTitle;
  });

  return partialMatch;
}

/**
 * Convert backlinks in content to HTML
 * @param content - Content with [[page]] links
 * @param allDocs - All available documents for linking
 * @returns HTML string with backlinks converted to anchor tags
 */
export function renderBacklinks(
  content: string,
  allDocs: { slug: string; title: string }[]
): string {
  return content.replace(BACKLINK_PATTERN, (_match, linkText: string) => {
    const trimmedText = linkText.trim();
    const doc = findDocumentByTitle(trimmedText, allDocs);

    if (doc) {
      // Document exists - create valid link
      return `<a href="/docs/${doc.slug}" class="backlink" data-exists="true">${trimmedText}</a>`;
    } else {
      // Document doesn't exist - create broken link (could be used for page creation)
      const newSlug = slugify(trimmedText);
      return `<a href="/edit/${newSlug}?create=true" class="backlink broken" data-exists="false" title="Create: ${trimmedText}">${trimmedText}</a>`;
    }
  });
}

/**
 * Extract context around a backlink for display
 * @param content - Full document content
 * @param linkTitle - Title being linked to
 * @param maxLength - Maximum context length
 * @returns Context string
 */
function extractContext(
  content: string,
  linkTitle: string,
  maxLength: number = 100
): string {
  const linkPattern = new RegExp(`\\[\\[${escapeRegex(linkTitle)}\\]\\]`, "i");
  const match = content.match(linkPattern);

  if (!match || match.index === undefined) {
    return "";
  }

  const start = Math.max(0, match.index - 50);
  const end = Math.min(content.length, match.index + match[0].length + 50);

  let context = content.slice(start, end);

  // Clean up the context
  context = context
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Add ellipsis if truncated
  if (start > 0) context = "..." + context;
  if (end < content.length) context = context + "...";

  // Highlight the link in context
  context = context.replace(
    linkPattern,
    `<strong>${linkTitle}</strong>`
  );

  return context.slice(0, maxLength);
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a backlink index for all documents
 * Maps each document to the documents that link to it
 * @param documents - All documents
 * @returns Map of slug to array of backlinks
 */
export function buildBacklinkIndex(
  documents: Document[]
): Map<string, Backlink[]> {
  const index = new Map<string, Backlink[]>();

  // Initialize empty arrays for all documents
  for (const doc of documents) {
    index.set(doc.slug, []);
  }

  // Find all backlinks in each document
  for (const sourceDoc of documents) {
    const linkedTitles = extractBacklinks(sourceDoc.content);

    for (const linkedTitle of linkedTitles) {
      // Find the target document
      const targetDoc = findDocumentByTitle(
        linkedTitle,
        documents.map((d) => ({ slug: d.slug, title: d.title }))
      );

      if (targetDoc) {
        // Add this document as a backlink to the target
        const backlinks = index.get(targetDoc.slug) || [];

        // Don't add duplicate backlinks from same source
        if (!backlinks.some((b) => b.slug === sourceDoc.slug)) {
          backlinks.push({
            slug: sourceDoc.slug,
            title: sourceDoc.title,
            context: extractContext(sourceDoc.content, linkedTitle),
          });
          index.set(targetDoc.slug, backlinks);
        }
      }
    }
  }

  return index;
}

/**
 * Get backlinks for a specific document
 * @param slug - Document slug
 * @param documents - All documents
 * @returns Array of backlinks pointing to this document
 */
export function getBacklinksForDocument(
  slug: string,
  documents: Document[]
): Backlink[] {
  const index = buildBacklinkIndex(documents);
  return index.get(slug) || [];
}

/**
 * Check if content contains any backlinks
 * @param content - Content to check
 * @returns true if backlinks are found
 */
export function hasBacklinks(content: string): boolean {
  BACKLINK_PATTERN.lastIndex = 0;
  return BACKLINK_PATTERN.test(content);
}

/**
 * Get all documents that the given document links to
 * @param content - Document content
 * @param allDocs - All documents
 * @returns Array of linked documents
 */
export function getOutgoingLinks(
  content: string,
  allDocs: { slug: string; title: string }[]
): { slug: string; title: string; exists: boolean }[] {
  const linkedTitles = extractBacklinks(content);

  return linkedTitles.map((title) => {
    const doc = findDocumentByTitle(title, allDocs);
    return {
      slug: doc?.slug || slugify(title),
      title: title,
      exists: !!doc,
    };
  });
}
