import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/github";

export const runtime = "edge";

/**
 * POST /api/auth/logout
 * Clears the auth cookie and logs out the user
 */
export async function POST(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;
  const response = NextResponse.redirect(baseUrl);

  // Clear the auth cookie
  response.cookies.delete(AUTH_COOKIE_NAME);

  return response;
}

/**
 * GET /api/auth/logout
 * Alternative logout via GET request (for simple links)
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
