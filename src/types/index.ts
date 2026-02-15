export interface WikiConfig {
  name: string;
  repo: string;
  defaultFolder: string;
  theme: "light" | "dark";
  visibility: "private" | "public";
  publicPaths: string[];
  features: {
    bbcode: boolean;
    backlinks: boolean;
    tags: boolean;
  };
}

export interface Document {
  slug: string;
  path: string;
  title: string;
  content: string;
  frontmatter: DocumentFrontmatter;
  children?: Document[];
}

export interface DocumentFrontmatter {
  title: string;
  tags?: string[];
  created?: string;
  updated?: string;
  public?: boolean;
}

export interface FolderMeta {
  title: string;
  icon?: string;
  order?: string[];
  collapsed?: boolean;
  public?: boolean;
}

export interface SearchResult {
  slug: string;
  title: string;
  path: string;
  excerpt: string;
  score: number;
}

export interface Backlink {
  slug: string;
  title: string;
  context: string;
}
