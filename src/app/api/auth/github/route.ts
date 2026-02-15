import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/github";

export const runtime = "edge";

/**
 * GET /api/auth/github
 * Redirects user to GitHub OAuth authorization page
 */
export async function GET() {
  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();

  const authUrl = buildAuthUrl(state);

  const response = NextResponse.redirect(authUrl);

  // Store state in cookie for verification in callback
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
