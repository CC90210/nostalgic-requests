import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("[Get Profile API] ====== REQUEST START ======");
  
  try {
    const body = await request.json();
    const { user_id } = body;

    console.log("[Get Profile API] Received user_id:", user_id);

    if (!user_id) {
      console.log("[Get Profile API] ERROR: No user_id provided");
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log("[Get Profile API] Supabase URL exists:", !!supabaseUrl);
    console.log("[Get Profile API] Service Key exists:", !!serviceKey);

    if (!supabaseUrl || !serviceKey) {
      console.log("[Get Profile API] ERROR: Missing environment variables");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log("[Get Profile API] Querying dj_profiles where user_id =", user_id);

    const { data: profile, error } = await supabaseAdmin
      .from("dj_profiles")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (error) {
      console.error("[Get Profile API] Database error:", error.message, error.code);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (profile) {
      console.log("[Get Profile API] SUCCESS - Found profile:", {
        id: profile.id,
        dj_name: profile.dj_name,
        email: profile.email,
        phone: profile.phone
      });
      return NextResponse.json({ profile });
    }

    console.log("[Get Profile API] No profile found for user_id:", user_id);
    
    // List all profiles for debugging
    const { data: allProfiles } = await supabaseAdmin
      .from("dj_profiles")
      .select("user_id, email, dj_name")
      .limit(5);
    
    console.log("[Get Profile API] Existing profiles in DB:", allProfiles);
    
    return NextResponse.json({ profile: null });
    
  } catch (error: any) {
    console.error("[Get Profile API] Exception:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

