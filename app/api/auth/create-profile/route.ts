import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, email, dj_name, full_name } = body;

    if (!user_id || !email || !dj_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("dj_profiles")
      .select("id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ message: "Profile already exists", profile: existingProfile });
    }

    // Create the profile
    const { data: profile, error } = await supabaseAdmin
      .from("dj_profiles")
      .insert({
        user_id,
        email,
        dj_name,
        full_name,
      })
      .select()
      .single();

    if (error) {
      console.error("Profile insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Create profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

