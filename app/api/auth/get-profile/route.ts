import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// This route uses SERVICE_ROLE_KEY to bypass RLS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    console.log("[Get Profile API] Fetching profile for:", user_id);

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: profile, error } = await supabaseAdmin
      .from("dj_profiles")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (error) {
      console.error("[Get Profile API] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (profile) {
      console.log("[Get Profile API] Found:", profile.dj_name);
      return NextResponse.json({ profile });
    }

    console.log("[Get Profile API] No profile found");
    return NextResponse.json({ profile: null });
  } catch (error: any) {
    console.error("[Get Profile API] Exception:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

