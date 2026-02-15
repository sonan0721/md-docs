import type { GitHubUser, GitHubRepo, GitHubContent } from "@/types";

const GITHUB_API_BASE = "https://api.github.com";

/**
 * GitHub OAuth configuration
 */
export const githubOAuthConfig = {
  clientId: process.env.GITHUB_CLIENT_ID || "",
  clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
  authorizeUrl: "https://github.com/login/oauth/authorize",
  tokenUrl: "https://github.com/login/oauth/access_token",
  scope: "read:user user:email repo",
};

/**
 * Build GitHub OAuth authorization URL
 */
export function buildAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: githubOAuthConfig.clientId,
    scope: githubOAuthConfig.scope,
    ...(state && { state }),
  });

  return `${githubOAuthConfig.authorizeUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch(githubOAuthConfig.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: githubOAuthConfig.clientId,
      client_secret: githubOAuthConfig.clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for token");
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return data.access_token;
}

/**
 * Fetch authenticated user from GitHub API
 */
export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  const data = await response.json();

  return {
    id: data.id,
    login: data.login,
    name: data.name,
    email: data.email,
    avatar_url: data.avatar_url,
    html_url: data.html_url,
  };
}

/**
 * Fetch user's repositories
 */
export async function fetchUserRepos(token: string): Promise<GitHubRepo[]> {
  const response = await fetch(
    `${GITHUB_API_BASE}/user/repos?sort=updated&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch repositories");
  }

  const data = await response.json();

  return (data as GitHubRepo[]).map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    description: repo.description,
    default_branch: repo.default_branch,
    updated_at: repo.updated_at,
  }));
}

/**
 * Fetch repository contents (files/folders)
 */
export async function fetchRepoContents(
  token: string,
  owner: string,
  repo: string,
  path?: string
): Promise<GitHubContent[]> {
  const endpoint = path
    ? `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`
    : `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error("Failed to fetch repository contents");
  }

  const data = await response.json();

  // If path points to a file, GitHub returns an object, not an array
  if (!Array.isArray(data)) {
    const item = data as GitHubContent;
    return [
      {
        name: item.name,
        path: item.path,
        type: item.type,
        sha: item.sha,
        size: item.size,
        download_url: item.download_url,
      },
    ];
  }

  return (data as GitHubContent[]).map((item) => ({
    name: item.name,
    path: item.path,
    type: item.type,
    sha: item.sha,
    size: item.size,
    download_url: item.download_url,
  }));
}

/**
 * Fetch a single file's content
 */
export async function fetchFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<{ content: string; sha: string }> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file content: ${response.status}`);
  }

  const data = await response.json();

  if (data.type !== "file") {
    throw new Error("Path does not point to a file");
  }

  // GitHub returns base64 encoded content
  const content = Buffer.from(data.content, "base64").toString("utf-8");

  return {
    content,
    sha: data.sha,
  };
}

/**
 * Cookie name for storing GitHub access token
 */
export const AUTH_COOKIE_NAME = "github_access_token";

/**
 * Cookie options for secure token storage
 */
export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};
