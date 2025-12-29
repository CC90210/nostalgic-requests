import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth check
  const publicRoutes = ["/login", "/signup", "/"];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Event pages are always public
  const isEventPage = pathname.startsWith("/e/");
  
  // API routes handle their own auth
  const isApiRoute = pathname.startsWith("/api/");

  // Skip auth check for public routes, event pages, and API routes
  if (isPublicRoute || isEventPage || isApiRoute) {
    return NextResponse.next();
  }

  // For dashboard routes, we let the client-side handle the redirect
  // This avoids issues with server-side session checking
  // The dashboard layout already checks auth and redirects if not logged in
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and _next
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

