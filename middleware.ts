import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
