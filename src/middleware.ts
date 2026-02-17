import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Authentication middleware for route protection.
 *
 * Route access rules:
 * - `/` - Public (landing page)
 * - `/p/*` - Public (public document routes)
 * - `/api/auth/*` - Public (auth endpoints)
 * - `/docs/*` - Requires authentication
 * - `/edit/*` - Requires authentication
 * - `/api/github/*` - Requires authentication
 */

// Routes that require authentication
const PROTECTED_ROUTES = ["/docs", "/edit", "/api/github"];

// Routes that are always public
const PUBLIC_ROUTES = ["/", "/p", "/api/auth"];

/**
 * Checks if a path matches any of the given route prefixes
 */
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some(
    (route) => path === route || path.startsWith(route + "/")
  );
}

/**
 * Checks if the user is authenticated by looking for the session cookie.
 * NextAuth stores session in a cookie named based on the NEXTAUTH_URL.
 */
function isAuthenticated(request: NextRequest): boolean {
  // NextAuth uses different cookie names based on environment
  // In development: next-auth.session-token
  // In production with HTTPS: __Secure-next-auth.session-token
  const sessionToken =
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

  return !!sessionToken;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // Check protected routes
  if (matchesRoute(pathname, PROTECTED_ROUTES)) {
    if (!isAuthenticated(request)) {
      // Store the original URL to redirect back after login
      const loginUrl = new URL("/api/auth/signin", request.url);
      loginUrl.searchParams.set("callbackUrl", request.url);

      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
