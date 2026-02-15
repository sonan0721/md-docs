import type { JSONContent } from "@tiptap/react";

/**
 * Convert markdown text to TipTap JSON content
 * This is a basic implementation that handles common markdown patterns
 */
export function markdownToTipTap(markdown: string): JSONContent {
  const lines = markdown.split("\n");
  const content: JSONContent[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines (will be handled as paragraph breaks)
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      content.push({
        type: "heading",
        attrs: { level },
        content: parseInlineContent(headingMatch[2]),
      });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      content.push({ type: "horizontalRule" });
      i++;
      continue;
    }

    // Code block (fenced)
    const codeBlockMatch = line.match(/^```(\w*)$/);
    if (codeBlockMatch) {
      const language = codeBlockMatch[1] || null;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      content.push({
        type: "codeBlock",
        attrs: { language },
        content: [{ type: "text", text: codeLines.join("\n") }],
      });
      i++; // Skip closing ```
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].substring(2));
        i++;
      }
      content.push({
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: parseInlineContent(quoteLines.join("\n")),
          },
        ],
      });
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const listItems: JSONContent[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^[-*+]\s/, "");
        listItems.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: parseInlineContent(itemText),
            },
          ],
        });
        i++;
      }
      content.push({
        type: "bulletList",
        content: listItems,
      });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const listItems: JSONContent[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s/, "");
        listItems.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: parseInlineContent(itemText),
            },
          ],
        });
        i++;
      }
      content.push({
        type: "orderedList",
        content: listItems,
      });
      continue;
    }

    // Task list
    if (/^[-*]\s\[[ x]\]\s/.test(line)) {
      const listItems: JSONContent[] = [];
      while (i < lines.length && /^[-*]\s\[[ x]\]\s/.test(lines[i])) {
        const checked = lines[i].includes("[x]");
        const itemText = lines[i].replace(/^[-*]\s\[[ x]\]\s/, "");
        listItems.push({
          type: "taskItem",
          attrs: { checked },
          content: [
            {
              type: "paragraph",
              content: parseInlineContent(itemText),
            },
          ],
        });
        i++;
      }
      content.push({
        type: "taskList",
        content: listItems,
      });
      continue;
    }

    // Regular paragraph
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith(">") &&
      !lines[i].startsWith("```") &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }

    if (paragraphLines.length > 0) {
      content.push({
        type: "paragraph",
        content: parseInlineContent(paragraphLines.join(" ")),
      });
    }
  }

  // Return empty paragraph if no content
  if (content.length === 0) {
    content.push({ type: "paragraph" });
  }

  return {
    type: "doc",
    content,
  };
}

/**
 * Parse inline content (bold, italic, code, links, etc.)
 */
function parseInlineContent(text: string): JSONContent[] {
  if (!text || text.trim() === "") {
    return [];
  }

  const content: JSONContent[] = [];
  let remaining = text;

  // Regex patterns for inline elements
  const patterns = [
    // Bold + Italic (must come before bold and italic)
    { regex: /\*\*\*(.+?)\*\*\*/, marks: [{ type: "bold" }, { type: "italic" }] },
    { regex: /___(.+?)___/, marks: [{ type: "bold" }, { type: "italic" }] },
    // Bold
    { regex: /\*\*(.+?)\*\*/, marks: [{ type: "bold" }] },
    { regex: /__(.+?)__/, marks: [{ type: "bold" }] },
    // Italic
    { regex: /\*(.+?)\*/, marks: [{ type: "italic" }] },
    { regex: /_(.+?)_/, marks: [{ type: "italic" }] },
    // Strikethrough
    { regex: /~~(.+?)~~/, marks: [{ type: "strike" }] },
    // Inline code
    { regex: /`([^`]+)`/, marks: [{ type: "code" }] },
    // Link
    { regex: /\[([^\]]+)\]\(([^)]+)\)/, isLink: true },
    // Image
    { regex: /!\[([^\]]*)\]\(([^)]+)\)/, isImage: true },
  ];

  while (remaining.length > 0) {
    let earliestMatch: {
      index: number;
      length: number;
      text: string;
      marks?: { type: string }[];
      isLink?: boolean;
      isImage?: boolean;
      href?: string;
      src?: string;
      alt?: string;
    } | null = null;

    // Find the earliest match
    for (const pattern of patterns) {
      const match = remaining.match(pattern.regex);
      if (match && match.index !== undefined) {
        if (!earliestMatch || match.index < earliestMatch.index) {
          if (pattern.isLink) {
            earliestMatch = {
              index: match.index,
              length: match[0].length,
              text: match[1],
              isLink: true,
              href: match[2],
            };
          } else if (pattern.isImage) {
            earliestMatch = {
              index: match.index,
              length: match[0].length,
              text: "",
              isImage: true,
              src: match[2],
              alt: match[1],
            };
          } else {
            earliestMatch = {
              index: match.index,
              length: match[0].length,
              text: match[1],
              marks: pattern.marks,
            };
          }
        }
      }
    }

    if (earliestMatch) {
      // Add text before the match
      if (earliestMatch.index > 0) {
        content.push({
          type: "text",
          text: remaining.substring(0, earliestMatch.index),
        });
      }

      // Add the matched content
      if (earliestMatch.isImage) {
        // Images are handled differently - they're block-level in TipTap
        // For inline context, we'll skip them or treat as text
        content.push({
          type: "text",
          text: `![${earliestMatch.alt}](${earliestMatch.src})`,
        });
      } else if (earliestMatch.isLink) {
        content.push({
          type: "text",
          text: earliestMatch.text,
          marks: [{ type: "link", attrs: { href: earliestMatch.href } }],
        });
      } else {
        content.push({
          type: "text",
          text: earliestMatch.text,
          marks: earliestMatch.marks,
        });
      }

      remaining = remaining.substring(
        earliestMatch.index + earliestMatch.length
      );
    } else {
      // No more matches, add remaining text
      content.push({
        type: "text",
        text: remaining,
      });
      break;
    }
  }

  return content;
}

/**
 * Convert TipTap JSON content to markdown
 */
export function tipTapToMarkdown(content: JSONContent): string {
  if (!content.content) {
    return "";
  }

  return content.content.map((node) => nodeToMarkdown(node)).join("\n\n");
}

/**
 * Convert a single TipTap node to markdown
 */
function nodeToMarkdown(node: JSONContent): string {
  switch (node.type) {
    case "paragraph":
      return inlineToMarkdown(node.content || []);

    case "heading":
      const level = node.attrs?.level || 1;
      const hashes = "#".repeat(level);
      return `${hashes} ${inlineToMarkdown(node.content || [])}`;

    case "bulletList":
      return (node.content || [])
        .map((item) => {
          const itemContent = item.content?.[0];
          if (itemContent) {
            return `- ${nodeToMarkdown(itemContent)}`;
          }
          return "- ";
        })
        .join("\n");

    case "orderedList":
      return (node.content || [])
        .map((item, index) => {
          const itemContent = item.content?.[0];
          if (itemContent) {
            return `${index + 1}. ${nodeToMarkdown(itemContent)}`;
          }
          return `${index + 1}. `;
        })
        .join("\n");

    case "taskList":
      return (node.content || [])
        .map((item) => {
          const checked = item.attrs?.checked ? "x" : " ";
          const itemContent = item.content?.[0];
          if (itemContent) {
            return `- [${checked}] ${nodeToMarkdown(itemContent)}`;
          }
          return `- [${checked}] `;
        })
        .join("\n");

    case "codeBlock":
      const language = node.attrs?.language || "";
      const code = node.content?.[0]?.text || "";
      return `\`\`\`${language}\n${code}\n\`\`\``;

    case "blockquote":
      return (node.content || [])
        .map((child) => `> ${nodeToMarkdown(child)}`)
        .join("\n");

    case "horizontalRule":
      return "---";

    case "image":
      const src = node.attrs?.src || "";
      const alt = node.attrs?.alt || "";
      return `![${alt}](${src})`;

    default:
      return inlineToMarkdown(node.content || []);
  }
}

/**
 * Convert inline content array to markdown string
 */
function inlineToMarkdown(content: JSONContent[]): string {
  return content
    .map((node) => {
      if (node.type !== "text" || !node.text) {
        return "";
      }

      let text = node.text;

      // Apply marks
      if (node.marks) {
        for (const mark of node.marks) {
          switch (mark.type) {
            case "bold":
              text = `**${text}**`;
              break;
            case "italic":
              text = `*${text}*`;
              break;
            case "strike":
              text = `~~${text}~~`;
              break;
            case "code":
              text = `\`${text}\``;
              break;
            case "underline":
              // Markdown doesn't have underline, use HTML
              text = `<u>${text}</u>`;
              break;
            case "link":
              const href = mark.attrs?.href || "";
              text = `[${text}](${href})`;
              break;
          }
        }
      }

      return text;
    })
    .join("");
}

/**
 * Extracts frontmatter from markdown content and returns body only
 */
export function extractFrontmatter(markdown: string): {
  frontmatter: string;
  body: string;
} {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (match) {
    return {
      frontmatter: match[1],
      body: match[2],
    };
  }
  return {
    frontmatter: "",
    body: markdown,
  };
}

/**
 * Combines frontmatter with body content
 */
export function combineFrontmatter(frontmatter: string, body: string): string {
  if (!frontmatter) {
    return body;
  }
  return `---\n${frontmatter}\n---\n${body}`;
}
