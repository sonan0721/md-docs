import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, updateFile, fetchFileContent } from "@/lib/github";

export const runtime = "edge";

interface SaveRequest {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
  sha?: string;
}

/**
 * POST /api/github/save
 * Saves a file to a GitHub repository (creates or updates)
 *
 * Request body:
 * - owner: Repository owner (required)
 * - repo: Repository name (required)
 * - path: Path to file in repository (required)
 * - content: File content (required)
 * - message: Commit message (required)
 * - sha: Existing file SHA (optional, required for updates)
 *
 * Response:
 * - success: boolean
 * - sha: New file SHA
 * - commitSha: Commit SHA
 */
export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  let body: SaveRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { owner, repo, path, content, message, sha } = body;

  // Validate required fields
  if (!owner || !repo || !path || content === undefined || !message) {
    return NextResponse.json(
      { error: "Missing required fields: owner, repo, path, content, message" },
      { status: 400 }
    );
  }

  try {
    // If no SHA provided, try to get the current file SHA (for updates)
    let fileSha = sha;

    if (!fileSha) {
      try {
        const existingFile = await fetchFileContent(accessToken, owner, repo, path);
        fileSha = existingFile.sha;
      } catch {
        // File doesn't exist, this is a create operation
        fileSha = undefined;
      }
    }

    const result = await updateFile(
      accessToken,
      owner,
      repo,
      path,
      content,
      message,
      fileSha
    );

    return NextResponse.json({
      success: true,
      sha: result.sha,
      commitSha: result.commit.sha,
    });
  } catch (err) {
    console.error("Failed to save file:", err);

    const errorMessage = err instanceof Error ? err.message : "Failed to save file";

    // Check for conflict error (SHA mismatch)
    if (errorMessage.includes("does not match")) {
      return NextResponse.json(
        {
          error: "File has been modified by someone else. Please refresh and try again.",
          code: "CONFLICT"
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
