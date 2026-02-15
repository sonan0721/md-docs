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

// GitHub OAuth Types
export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
}

export interface AuthState {
  user: GitHubUser | null;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// GitHub Repository Types
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  default_branch: string;
  updated_at: string;
}

export interface GitHubContent {
  name: string;
  path: string;
  type: "file" | "dir";
  sha: string;
  size?: number;
  download_url?: string;
}

// Repository Selection State
export interface RepoState {
  selectedRepo: { owner: string; repo: string } | null;
  isLoading: boolean;
  error: string | null;
  selectRepo: (owner: string, repo: string) => void;
  clearRepo: () => void;
  loadFromStorage: () => void;
}
