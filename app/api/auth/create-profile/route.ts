import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getResend } from "@/lib/resend";
import WelcomeEmail from "@/emails/WelcomeEmail";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, email, dj_name, full_name, phone } = body;

    // Log incoming data for debugging
    console.log("[Create Profile] Request received:", { user_id, email, dj_name, phone });

    if (!user_id || !email || !dj_name) {
      console.log("[Create Profile] Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("dj_profiles")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingProfile) {
      console.log("[Create Profile] Profile already exists:", existingProfile.dj_name);
      return NextResponse.json({ 
        message: "Profile already exists", 
        profile: existingProfile 
      });
    }

    // Create the profile
    const { data: profile, error } = await supabaseAdmin
      .from("dj_profiles")
      .insert({
        user_id,
        email,
        dj_name,
        full_name: full_name || null,
        phone: phone || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[Create Profile] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[Create Profile] Profile created successfully:", profile.dj_name);

    // Send Welcome Email
    const resend = getResend();
    if (resend) {
      try {
        await resend.emails.send({
          from: "Nostalgic <onboarding@resend.dev>",
          to: email,
          subject: "Welcome to Nostalgic Requests!",
          react: WelcomeEmail({ djName: dj_name }),
        });
        console.log("[Create Profile] Welcome email sent to:", email);
      } catch (emailError) {
        console.error("[Create Profile] Email error:", emailError);
      }
    }

    // Return the full profile object for immediate hydration
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[Create Profile] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

