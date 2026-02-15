import type { GitHubUser } from "@/types";

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
