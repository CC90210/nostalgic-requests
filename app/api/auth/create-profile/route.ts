import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getResend } from "@/lib/resend";
import WelcomeEmail from "@/emails/WelcomeEmail";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, email, dj_name, full_name, phone } = body;

    if (!user_id || !email || !dj_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existingProfile } = await supabaseAdmin
      .from("dj_profiles")
      .select("id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ message: "Profile already exists", profile: existingProfile });
    }

    const { data: profile, error } = await supabaseAdmin
      .from("dj_profiles")
      .insert({
        user_id,
        email,
        dj_name,
        full_name,
        phone,
      })
      .select()
      .single();

    if (error) {
      console.error("Profile insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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
        console.log("Welcome email sent to:", email);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
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

