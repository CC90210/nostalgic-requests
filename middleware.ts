import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionEdge } from '@/lib/turso-auth-edge';

export async function middleware(request: NextRequest) {
  // Turso auth mode: our HMAC cookie is the session — verified inline, no
  // Supabase round trip (and none of the timeout scaffolding below needed).
  if (process.env.EMPIRE_AUTH_BACKEND === 'turso' && process.env.AUTH_SESSION_SECRET) {
    const isProtectedPath = request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/my-events');
    if (!isProtectedPath) return NextResponse.next({ request });
    const session = await verifySessionEdge(
      request.cookies.get('nostalgic_session')?.value, process.env.AUTH_SESSION_SECRET);
    if (session) return NextResponse.next({ request });
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
      global: {
        fetch: (url, options) => {
          return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Supabase fetch timeout in Edge middleware')), 3000)
            ),
          ]) as Promise<Response>;
        },
      },
    }
  );

  let session = null;
  let error = null;
  try {
    // Add an extra layer of timeout just in case
    const res = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('GetSession timeout')), 3500))
    ]) as any;
    
    session = res.data?.session || null;
    error = res.error || null;
  } catch (e: any) {
    console.error('Supabase connection error in middleware:', e.message);
    error = e;
  }

  const isProtected = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/my-events');

  if ((!session || error) && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    const allCookies = request.cookies.getAll();
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        redirectResponse.cookies.delete(cookie.name);
      }
    });
    redirectResponse.cookies.delete('sb-access-token');
    redirectResponse.cookies.delete('sb-refresh-token');
    return redirectResponse;
  }

  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  supabaseResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
