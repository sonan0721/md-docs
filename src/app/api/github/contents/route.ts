import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  fetchRepoContents,
  fetchFileContent,
} from "@/lib/github";

export const runtime = "edge";

/**
 * GET /api/github/contents
 * Returns repository contents (files/folders) or a single file's content
 *
 * Query params:
 * - owner: Repository owner (required)
 * - repo: Repository name (required)
 * - path: Path within the repository (optional, defaults to root)
 * - file: If "true", fetches the file content instead of directory listing
 */
export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path") || undefined;
  const isFile = searchParams.get("file") === "true";

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Missing required parameters: owner and repo" },
      { status: 400 }
    );
  }

  try {
    if (isFile && path) {
      // Fetch file content
      const fileData = await fetchFileContent(accessToken, owner, repo, path);
      return NextResponse.json(fileData);
    } else {
      // Fetch directory contents
      const contents = await fetchRepoContents(accessToken, owner, repo, path);
      return NextResponse.json({ contents });
    }
  } catch (err) {
    console.error("Failed to fetch contents:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch contents";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
