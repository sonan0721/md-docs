import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, fetchUserRepos } from "@/lib/github";

export const runtime = "edge";

/**
 * GET /api/github/repos
 * Returns the authenticated user's repositories
 */
export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const repos = await fetchUserRepos(accessToken);
    return NextResponse.json({ repos });
  } catch (err) {
    console.error("Failed to fetch repos:", err);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
