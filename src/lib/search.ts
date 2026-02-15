import { Index as FlexSearchIndex } from "flexsearch";
import { getChoseong, disassemble } from "es-hangul";
import type { Document, SearchResult } from "@/types";

// ============================================
// Types
// ============================================

export interface SearchIndex {
  titleIndex: FlexSearchIndex;
  contentIndex: FlexSearchIndex;
  tagIndex: FlexSearchIndex;
  headingIndex: FlexSearchIndex;
  documents: Map<number, IndexedDocument>;
}

export interface IndexedDocument {
  id: number;
  slug: string;
  title: string;
  path: string;
  content: string;
  tags: string[];
  headings: string[];
}

export interface SearchOptions {
  limit?: number;
  fuzzy?: boolean;
  threshold?: number;
}

// Search weights for scoring
const WEIGHTS = {
  title: 3.0,
  tags: 2.5,
  headings: 2.0,
  content: 1.0,
};

// ============================================
// Korean Language Utilities
// ============================================

/**
 * Checks if a character is Korean
 */
function isKorean(char: string): boolean {
  const code = char.charCodeAt(0);
  // Hangul Syllables: AC00-D7AF
  // Hangul Jamo: 1100-11FF
  // Hangul Compatibility Jamo: 3130-318F
  // Hangul Jamo Extended-A: A960-A97F
  // Hangul Jamo Extended-B: D7B0-D7FF
  return (
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0x1100 && code <= 0x11ff) ||
    (code >= 0x3130 && code <= 0x318f) ||
    (code >= 0xa960 && code <= 0xa97f) ||
    (code >= 0xd7b0 && code <= 0xd7ff)
  );
}

/**
 * Checks if a string contains only chosung (initial consonants)
 */
function isChosungOnly(str: string): boolean {
  const chosungPattern = /^[ㄱ-ㅎ]+$/;
  return chosungPattern.test(str);
}

/**
 * Checks if text contains Korean characters
 */
function containsKorean(text: string): boolean {
  return text.split("").some(isKorean);
}

/**
 * Checks if text's chosung (initial consonants) includes the query chosung
 * e.g., chosungIncludes("프로젝트", "ㅍㄹㅈ") => true
 */
function chosungIncludes(text: string, chosungQuery: string): boolean {
  const textChosung = getChoseong(text);
  return textChosung.includes(chosungQuery);
}

/**
 * Normalize Korean query for search
 * Handles chosung search and returns possible search variants
 */
export function normalizeKoreanQuery(query: string): string[] {
  const variants: string[] = [query];

  // If query is chosung-only (e.g., "ㅍㄹㅈ")
  if (isChosungOnly(query)) {
    // Keep the chosung for special matching
    variants.push(query);
    return variants;
  }

  // If query contains Korean, add disassembled version for fuzzy matching
  if (containsKorean(query)) {
    try {
      const disassembled = disassemble(query);
      if (disassembled !== query) {
        variants.push(disassembled);
      }
      // Also add chosung only version
      const chosung = getChoseong(query);
      if (chosung && chosung !== query) {
        variants.push(chosung);
      }
    } catch {
      // Ignore errors in Korean processing
    }
  }

  return [...new Set(variants)];
}

/**
 * Korean-aware string matching
 * Supports chosung (initial consonant) search
 */
function koreanMatch(text: string, query: string): boolean {
  // Direct match
  if (text.toLowerCase().includes(query.toLowerCase())) {
    return true;
  }

  // Chosung match (e.g., "ㅍㄹㅈ" matches "프로젝트")
  if (isChosungOnly(query)) {
    try {
      return chosungIncludes(text, query);
    } catch {
      return false;
    }
  }

  // Partial Korean match using disassembled forms
  if (containsKorean(query)) {
    try {
      const textDisassembled = disassemble(text);
      const queryDisassembled = disassemble(query);
      return textDisassembled
        .toLowerCase()
        .includes(queryDisassembled.toLowerCase());
    } catch {
      return false;
    }
  }

  return false;
}

// ============================================
// Heading Extraction
// ============================================

/**
 * Extract headings (H1-H3) from markdown content
 */
function extractHeadings(content: string): string[] {
  const headings: string[] = [];
  const headingRegex = /^#{1,3}\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    headings.push(match[1].trim());
  }

  return headings;
}

/**
 * Extract plain text from markdown (strip formatting)
 */
function stripMarkdown(content: string): string {
  return (
    content
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, " ")
      // Remove inline code
      .replace(/`[^`]+`/g, " ")
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, " ")
      // Remove bold/italic
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
      // Remove headings markers
      .replace(/^#{1,6}\s+/gm, "")
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, " ")
      // Remove blockquotes
      .replace(/^>\s+/gm, "")
      // Remove list markers
      .replace(/^[\s]*[-*+]\s+/gm, " ")
      .replace(/^[\s]*\d+\.\s+/gm, " ")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

// ============================================
// Search Index Creation
// ============================================

/**
 * Create search index from documents
 */
export function createSearchIndex(documents: Document[]): SearchIndex {
  // Create FlexSearch indices with Korean-friendly settings
  const titleIndex = new FlexSearchIndex({
    tokenize: "forward",
    resolution: 9,
    cache: true,
  });

  const contentIndex = new FlexSearchIndex({
    tokenize: "forward",
    resolution: 9,
    cache: true,
  });

  const tagIndex = new FlexSearchIndex({
    tokenize: "forward",
    resolution: 9,
    cache: true,
  });

  const headingIndex = new FlexSearchIndex({
    tokenize: "forward",
    resolution: 9,
    cache: true,
  });

  const documentMap = new Map<number, IndexedDocument>();

  // Index all documents
  documents.forEach((doc, id) => {
    const plainContent = stripMarkdown(doc.content);
    const headings = extractHeadings(doc.content);
    const tags = doc.frontmatter.tags || [];

    const indexedDoc: IndexedDocument = {
      id,
      slug: doc.slug,
      title: doc.title,
      path: doc.path,
      content: plainContent,
      tags,
      headings,
    };

    documentMap.set(id, indexedDoc);

    // Index title
    titleIndex.add(id, doc.title);

    // Index content
    contentIndex.add(id, plainContent);

    // Index tags
    if (tags.length > 0) {
      tagIndex.add(id, tags.join(" "));
    }

    // Index headings
    if (headings.length > 0) {
      headingIndex.add(id, headings.join(" "));
    }
  });

  return {
    titleIndex,
    contentIndex,
    tagIndex,
    headingIndex,
    documents: documentMap,
  };
}

// ============================================
// Search Implementation
// ============================================

/**
 * Calculate similarity score for fuzzy matching
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Simple character overlap for fuzzy matching
  const chars1 = new Set(s1.split(""));
  const chars2 = new Set(s2.split(""));
  let overlap = 0;
  chars1.forEach((c) => {
    if (chars2.has(c)) overlap++;
  });

  return overlap / Math.max(chars1.size, chars2.size);
}

/**
 * Extract excerpt around a match
 */
function extractExcerpt(
  content: string,
  query: string,
  maxLength: number = 150
): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let matchIndex = lowerContent.indexOf(lowerQuery);

  // Try chosung match if direct match not found
  if (matchIndex === -1 && isChosungOnly(query)) {
    // Find approximate position using chosung matching
    const words = content.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      try {
        if (chosungIncludes(words[i], query)) {
          matchIndex = content.indexOf(words[i]);
          break;
        }
      } catch {
        continue;
      }
    }
  }

  // Try Korean partial match
  if (matchIndex === -1 && containsKorean(query)) {
    try {
      const queryDisassembled = disassemble(query);
      const words = content.split(/\s+/);
      for (const word of words) {
        const wordDisassembled = disassemble(word);
        if (
          wordDisassembled.toLowerCase().includes(queryDisassembled.toLowerCase())
        ) {
          matchIndex = content.indexOf(word);
          break;
        }
      }
    } catch {
      // Ignore
    }
  }

  if (matchIndex === -1) {
    // No match found, return start of content
    return content.slice(0, maxLength) + (content.length > maxLength ? "..." : "");
  }

  // Calculate excerpt boundaries
  const halfLength = Math.floor(maxLength / 2);
  let start = Math.max(0, matchIndex - halfLength);
  let end = Math.min(content.length, matchIndex + query.length + halfLength);

  // Adjust to word boundaries
  if (start > 0) {
    const spaceIndex = content.indexOf(" ", start);
    if (spaceIndex !== -1 && spaceIndex < matchIndex) {
      start = spaceIndex + 1;
    }
  }

  if (end < content.length) {
    const spaceIndex = content.lastIndexOf(" ", end);
    if (spaceIndex !== -1 && spaceIndex > matchIndex) {
      end = spaceIndex;
    }
  }

  let excerpt = content.slice(start, end);
  if (start > 0) excerpt = "..." + excerpt;
  if (end < content.length) excerpt = excerpt + "...";

  return excerpt;
}

/**
 * Search the index with a query
 */
export function search(
  index: SearchIndex,
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const { limit = 20, fuzzy = true, threshold = 0.3 } = options;

  if (!query.trim()) {
    return [];
  }

  const queryVariants = normalizeKoreanQuery(query.trim());
  const scores = new Map<number, number>();
  const matchedFields = new Map<number, Set<string>>();

  // Helper to add score
  const addScore = (id: number, weight: number, field: string) => {
    const currentScore = scores.get(id) || 0;
    scores.set(id, currentScore + weight);

    if (!matchedFields.has(id)) {
      matchedFields.set(id, new Set());
    }
    matchedFields.get(id)!.add(field);
  };

  // Search with FlexSearch
  for (const variant of queryVariants) {
    // Title search
    const titleResults = index.titleIndex.search(variant, { limit: 50 });
    titleResults.forEach((id) => addScore(id as number, WEIGHTS.title, "title"));

    // Tag search
    const tagResults = index.tagIndex.search(variant, { limit: 50 });
    tagResults.forEach((id) => addScore(id as number, WEIGHTS.tags, "tags"));

    // Heading search
    const headingResults = index.headingIndex.search(variant, { limit: 50 });
    headingResults.forEach((id) =>
      addScore(id as number, WEIGHTS.headings, "headings")
    );

    // Content search
    const contentResults = index.contentIndex.search(variant, { limit: 100 });
    contentResults.forEach((id) =>
      addScore(id as number, WEIGHTS.content, "content")
    );
  }

  // Korean-specific matching (for chosung and partial matching)
  if (containsKorean(query) || isChosungOnly(query)) {
    index.documents.forEach((doc, id) => {
      // Check title with Korean matching
      if (koreanMatch(doc.title, query)) {
        addScore(id, WEIGHTS.title * 0.8, "title");
      }

      // Check tags with Korean matching
      for (const tag of doc.tags) {
        if (koreanMatch(tag, query)) {
          addScore(id, WEIGHTS.tags * 0.8, "tags");
          break;
        }
      }

      // Check headings with Korean matching
      for (const heading of doc.headings) {
        if (koreanMatch(heading, query)) {
          addScore(id, WEIGHTS.headings * 0.8, "headings");
          break;
        }
      }

      // Check content with Korean matching (limited to avoid performance issues)
      if (koreanMatch(doc.content.slice(0, 5000), query)) {
        addScore(id, WEIGHTS.content * 0.8, "content");
      }
    });
  }

  // Fuzzy matching for typo tolerance
  if (fuzzy && scores.size === 0) {
    index.documents.forEach((doc, id) => {
      const similarity = calculateSimilarity(doc.title, query);
      if (similarity >= threshold) {
        addScore(id, WEIGHTS.title * similarity, "title");
      }
    });
  }

  // Convert to results and sort by score
  const results: SearchResult[] = [];

  scores.forEach((score, id) => {
    const doc = index.documents.get(id);
    if (!doc) return;

    // Normalize score to percentage (0-100)
    const maxPossibleScore =
      WEIGHTS.title + WEIGHTS.tags + WEIGHTS.headings + WEIGHTS.content;
    const normalizedScore = Math.min(100, Math.round((score / maxPossibleScore) * 100));

    results.push({
      slug: doc.slug,
      title: doc.title,
      path: doc.path,
      excerpt: extractExcerpt(doc.content, query),
      score: normalizedScore,
    });
  });

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Apply limit
  return results.slice(0, limit);
}

/**
 * Get search suggestions based on partial query
 */
export function getSuggestions(
  index: SearchIndex,
  query: string,
  limit: number = 5
): string[] {
  if (!query.trim() || query.length < 2) {
    return [];
  }

  const suggestions = new Set<string>();

  // Get title suggestions
  index.documents.forEach((doc) => {
    if (
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      koreanMatch(doc.title, query)
    ) {
      suggestions.add(doc.title);
    }
  });

  // Get tag suggestions
  index.documents.forEach((doc) => {
    for (const tag of doc.tags) {
      if (
        tag.toLowerCase().includes(query.toLowerCase()) ||
        koreanMatch(tag, query)
      ) {
        suggestions.add(tag);
      }
    }
  });

  return Array.from(suggestions).slice(0, limit);
}
