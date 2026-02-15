import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  AUTH_COOKIE_NAME,
  authCookieOptions,
} from "@/lib/github";

export const runtime = "edge";

/**
 * GET /api/auth/callback
 * Handles GitHub OAuth callback, exchanges code for token
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Get the base URL for redirects
  const baseUrl = request.nextUrl.origin;

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${baseUrl}?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // Validate code parameter
  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}?error=${encodeURIComponent("No authorization code received")}`
    );
  }

  try {
    // Exchange the code for an access token
    const accessToken = await exchangeCodeForToken(code);

    // Create response with redirect to home
    const response = NextResponse.redirect(baseUrl);

    // Set the access token in an httpOnly cookie
    response.cookies.set(AUTH_COOKIE_NAME, accessToken, authCookieOptions);

    // Clear the OAuth state cookie
    response.cookies.delete("oauth_state");

    return response;
  } catch (err) {
    console.error("Token exchange error:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to complete authentication";
    return NextResponse.redirect(
      `${baseUrl}?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
