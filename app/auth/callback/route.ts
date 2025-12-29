import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    // Create a Supabase client for auth exchange
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to dashboard or specified redirect_to param
      return NextResponse.redirect(`${origin}${redirectTo || "/dashboard"}`);
    }

    console.error("Auth callback error:", error);
  }

  // If code exchange failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=verification_failed`);
}

