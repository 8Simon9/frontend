// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the token from cookies - middleware uses cookies from the request
  const token = request.cookies.get("auth_token")?.value;

  const isAuthPath = request.nextUrl.pathname.startsWith("/api/auth");

  // Public paths accessible by EVERYONE (both guests and logged-in users)
  const publicPaths = ["/", "/privacy-policy", "/terms-of-service"];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  // Paths ONLY for guests (redirect to /trade if logged in)
  const guestOnlyPaths = ["/login", "/register", "/forgot-password"];
  const isGuestOnlyPath = guestOnlyPaths.includes(request.nextUrl.pathname);

  // Redirect to login if accessing protected routes without token
  if (!token && !isPublicPath && !isGuestOnlyPath && !isAuthPath) {
    const url = new URL("/login", request.url);
    // Add a redirect url parameter so users can be sent back after login
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to trade if authenticated user tries to access login/register
  if (token && isGuestOnlyPath) {
    return NextResponse.redirect(new URL("/trade", request.url));
  }

  return NextResponse.next();
}

// Only run middleware on these paths
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes that don't require authentication
     * 2. /_next (Next.js internals)
     * 3. /public (static files)
     * 4. /_vercel (Vercel internals)
     * 5. Static files like favicon.ico, robots.txt, etc.
     */
    "/((?!_next|public|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp).*)",
  ],
};
