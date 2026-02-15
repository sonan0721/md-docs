import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, fetchGitHubUser } from "@/lib/github";

export const runtime = "edge";

/**
 * GET /api/auth/me
 * Returns the current authenticated user, or null if not authenticated
 */
export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!accessToken) {
    return NextResponse.json({ user: null });
  }

  try {
    const user = await fetchGitHubUser(accessToken);
    return NextResponse.json({ user });
  } catch (err) {
    console.error("Failed to fetch user:", err);

    // If token is invalid, return null user
    // The client should handle re-authentication
    return NextResponse.json({ user: null });
  }
}
