import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import type { DocumentFrontmatter } from "@/types";

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
 * Parses raw markdown content into a structured document
 */
export async function parseMarkdown(rawContent: string): Promise<ParsedDocument> {
  // Extract frontmatter and content using gray-matter
  const { data, content } = matter(rawContent);

  // Convert markdown to HTML using remark
  const processedContent = await remark().use(html).process(content);
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
