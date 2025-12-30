import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // PUBLIC ROUTES - No auth check needed
  // These routes are accessible to everyone without login
  const publicPatterns = [
    "/",           // Homepage
    "/login",      // Login page
    "/signup",     // Signup page
    "/e/",         // Event portals (public song request pages)
    "/api/",       // API routes (handle their own auth)
  ];

  // Check if this is a public route
  const isPublic = publicPatterns.some(pattern => pathname.startsWith(pattern) || pathname === pattern);

  if (isPublic) {
    // Let public routes pass through immediately - NO AUTH CHECK
    return NextResponse.next();
  }

  // For all other routes (dashboard, etc.), let client-side handle auth
  // The dashboard layout already checks auth and redirects if not logged in
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes EXCEPT static files, images, and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

