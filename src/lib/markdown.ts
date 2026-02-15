import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import type { DocumentFrontmatter } from "@/types";
import { parseBBCode } from "./bbcode";
import { renderBacklinks } from "./backlinks";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface ParsedDocument {
  frontmatter: DocumentFrontmatter;
  content: string;
  html: string;
  toc: TocItem[];
}

/**
 * Converts a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s가-힣-]/g, "") // Keep letters, numbers, spaces, Korean, hyphens
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/-+/g, "-") // Remove consecutive hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Extracts table of contents from HTML content (H2 and H3 headings)
 */
function extractToc(htmlContent: string): TocItem[] {
  const toc: TocItem[] = [];
  const headingRegex = /<h([23])(?:[^>]*)>([^<]+)<\/h[23]>/gi;
  let match;

  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1], 10);
    const text = match[2].trim();
    const id = slugify(text);

    toc.push({ id, text, level });
  }

  return toc;
}

/**
 * Adds IDs to headings in HTML for ToC linking
 */
function addHeadingIds(htmlContent: string): string {
  return htmlContent.replace(
    /<h([23])(?:[^>]*)>([^<]+)<\/h[23]>/gi,
    (_, level, text) => {
      const id = slugify(text.trim());
      return `<h${level} id="${id}">${text}</h${level}>`;
    }
  );
}

/**
 * Options for parseMarkdown
 */
export interface ParseMarkdownOptions {
  /** All documents for backlink resolution */
  allDocs?: { slug: string; title: string }[];
  /** Enable BBCode processing (default: true) */
  processBBCode?: boolean;
  /** Enable backlink processing (default: true) */
  processBacklinks?: boolean;
}

/**
 * Parses raw markdown content into a structured document
 * @param rawContent - Raw markdown with optional frontmatter
 * @param options - Parsing options for BBCode and backlinks
 */
export async function parseMarkdown(
  rawContent: string,
  options: ParseMarkdownOptions = {}
): Promise<ParsedDocument> {
  const {
    allDocs = [],
    processBBCode = true,
    processBacklinks = true,
  } = options;

  // Extract frontmatter and content using gray-matter
  const { data, content } = matter(rawContent);

  // Process BBCode first (before markdown conversion)
  let processedText = content;
  if (processBBCode) {
    processedText = parseBBCode(processedText);
  }

  // Process backlinks (before markdown conversion)
  if (processBacklinks && allDocs.length > 0) {
    processedText = renderBacklinks(processedText, allDocs);
  }

  // Convert markdown to HTML using remark
  // Note: remark-html will preserve existing HTML tags from BBCode/backlinks
  const processedContent = await remark()
    .use(html, { sanitize: false }) // Don't sanitize to preserve BBCode HTML
    .process(processedText);
  let htmlContent = processedContent.toString();

  // Extract ToC before adding IDs (to get clean text)
  const toc = extractToc(htmlContent);

  // Add IDs to headings for ToC linking
  htmlContent = addHeadingIds(htmlContent);

  // Build frontmatter with defaults
  const frontmatter: DocumentFrontmatter = {
    title: data.title || "Untitled",
    tags: data.tags || [],
    created: data.created || undefined,
    updated: data.updated || undefined,
    public: data.public ?? false,
  };

  return {
    frontmatter,
    content,
    html: htmlContent,
    toc,
  };
}
