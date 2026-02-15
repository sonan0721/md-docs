/**
 * BBCode Parser
 * Converts BBCode tags to HTML for wiki-style formatting
 */

interface BBCodeTag {
  pattern: RegExp;
  replacement: string | ((match: string, ...args: string[]) => string);
}

/**
 * BBCode tag definitions
 */
const bbcodeTags: BBCodeTag[] = [
  // Styling tags
  {
    // [color=red]text[/color]
    pattern: /\[color=([^\]]+)\]([^[]*?)\[\/color\]/gi,
    replacement: '<span style="color: $1">$2</span>',
  },
  {
    // [size=20]text[/size]
    pattern: /\[size=(\d+)\]([^[]*?)\[\/size\]/gi,
    replacement: '<span style="font-size: $1px">$2</span>',
  },
  {
    // [highlight=yellow]text[/highlight]
    pattern: /\[highlight=([^\]]+)\]([^[]*?)\[\/highlight\]/gi,
    replacement:
      '<mark class="bbcode-highlight" style="background-color: $1">$2</mark>',
  },

  // Layout tags
  {
    // [box title="Note" type="info"]content[/box]
    // Using [\s\S] instead of . with s flag for compatibility
    pattern:
      /\[box(?:\s+title="([^"]*)")?(?:\s+type="([^"]*)")?\]([\s\S]*?)\[\/box\]/gi,
    replacement: (
      _match: string,
      title: string,
      type: string,
      content: string
    ) => {
      const boxType = type || "default";
      const titleHtml = title
        ? `<div class="bbcode-box-title">${title}</div>`
        : "";
      return `<div class="bbcode-box bbcode-box-${boxType}">${titleHtml}<div class="bbcode-box-content">${content.trim()}</div></div>`;
    },
  },
  {
    // [spoiler title="Click to reveal"]hidden content[/spoiler]
    // Using [\s\S] instead of . with s flag for compatibility
    pattern: /\[spoiler(?:\s+title="([^"]*)")?\]([\s\S]*?)\[\/spoiler\]/gi,
    replacement: (_match: string, title: string, content: string) => {
      const summaryText = title || "Click to reveal";
      return `<details class="bbcode-spoiler"><summary>${summaryText}</summary><div class="bbcode-spoiler-content">${content.trim()}</div></details>`;
    },
  },

  // Additional common BBCode tags
  {
    // [b]bold[/b]
    pattern: /\[b\]([^[]*?)\[\/b\]/gi,
    replacement: "<strong>$1</strong>",
  },
  {
    // [i]italic[/i]
    pattern: /\[i\]([^[]*?)\[\/i\]/gi,
    replacement: "<em>$1</em>",
  },
  {
    // [u]underline[/u]
    pattern: /\[u\]([^[]*?)\[\/u\]/gi,
    replacement: '<span class="bbcode-underline">$1</span>',
  },
  {
    // [s]strikethrough[/s]
    pattern: /\[s\]([^[]*?)\[\/s\]/gi,
    replacement: "<del>$1</del>",
  },
  {
    // [code]code[/code]
    pattern: /\[code\]([^[]*?)\[\/code\]/gi,
    replacement: '<code class="bbcode-code">$1</code>',
  },
  {
    // [center]centered text[/center]
    pattern: /\[center\]([^[]*?)\[\/center\]/gi,
    replacement: '<div class="bbcode-center">$1</div>',
  },
  {
    // [quote]quoted text[/quote]
    pattern: /\[quote\]([^[]*?)\[\/quote\]/gi,
    replacement: '<blockquote class="bbcode-quote">$1</blockquote>',
  },
  {
    // [quote="Author"]quoted text[/quote]
    pattern: /\[quote="([^"]*)"\]([^[]*?)\[\/quote\]/gi,
    replacement:
      '<blockquote class="bbcode-quote"><cite>$1</cite>$2</blockquote>',
  },
];

/**
 * Parse BBCode tags in text and convert to HTML
 * @param text - Text containing BBCode
 * @returns HTML string with BBCode converted
 */
export function parseBBCode(text: string): string {
  let result = text;

  for (const tag of bbcodeTags) {
    if (typeof tag.replacement === "string") {
      result = result.replace(tag.pattern, tag.replacement);
    } else {
      result = result.replace(tag.pattern, tag.replacement);
    }
  }

  return result;
}

/**
 * Check if text contains any BBCode tags
 * @param text - Text to check
 * @returns true if BBCode is found
 */
export function hasBBCode(text: string): boolean {
  const bbcodePattern = /\[(?:color|size|highlight|box|spoiler|b|i|u|s|code|center|quote)(?:=|])/i;
  return bbcodePattern.test(text);
}

/**
 * Strip all BBCode tags from text
 * @param text - Text containing BBCode
 * @returns Plain text without BBCode
 */
export function stripBBCode(text: string): string {
  // Remove all BBCode tags but keep their content
  let result = text;

  // Remove opening tags with attributes
  result = result.replace(/\[(\w+)(?:=[^\]]+)?\]/gi, "");
  // Remove closing tags
  result = result.replace(/\[\/\w+\]/gi, "");

  return result;
}

/**
 * Escape BBCode tags so they display literally
 * @param text - Text to escape
 * @returns Text with BBCode tags escaped
 */
export function escapeBBCode(text: string): string {
  return text
    .replace(/\[/g, "&#91;")
    .replace(/\]/g, "&#93;");
}
