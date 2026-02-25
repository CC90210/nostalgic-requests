import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

declare global {
  var _requestCounts: Map<string, { count: number; expires: number }> | undefined;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh Session
  const { data: { user }, error } = await supabase.auth.getUser();

  const isProtected = request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/my-events");

  // IF TOKEN IS INVALID: FORCE LOGOUT & NUKE COOKIES
  if ((!user || error) && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);

    // Clear all potential Supabase cookies to prevent loops
    const allCookies = request.cookies.getAll();
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith("sb-")) {
        redirectResponse.cookies.delete(cookie.name);
      }
    });
    // Also delete generic ones just in case
    redirectResponse.cookies.delete("sb-access-token");
    redirectResponse.cookies.delete("sb-refresh-token");

    return redirectResponse;
  }

  // Rate Limiting (Basic IP-based)
  // Note: logic is usually handled by Vercel Firewall or Redis in production,
  // but we implement a basic protection layer here.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const limit = 100; // requests
  const window = 15 * 60 * 1000; // 15 minutes

  // This Map will reset on serverless function cold starts, but provides basic protection.
  if (!globalThis._requestCounts) {
    globalThis._requestCounts = new Map<string, { count: number; expires: number }>();
  }

  const now = Date.now();
  const userData = globalThis._requestCounts.get(ip);

  if (userData && now < userData.expires) {
    userData.count++;
    if (userData.count > limit) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": Math.ceil((userData.expires - now) / 1000).toString() }
      });
    }
  } else {
    globalThis._requestCounts.set(ip, { count: 1, expires: now + window });
  }

  // Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
