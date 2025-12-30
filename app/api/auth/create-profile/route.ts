import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getResend } from "@/lib/resend";
import WelcomeEmail from "@/emails/WelcomeEmail";

export async function POST(request: NextRequest) {
  console.log("[Create Profile API] Request received");
  
  try {
    const body = await request.json();
    const { user_id, email, dj_name, full_name, phone } = body;

    console.log("[Create Profile API] Data:", { user_id, email, dj_name, phone });

    if (!user_id || !email) {
      console.log("[Create Profile API] Missing user_id or email");
      return NextResponse.json(
        { error: "Missing required fields: user_id and email" },
        { status: 400 }
      );
    }

    // Use SERVICE_ROLE_KEY to bypass ALL RLS policies
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Use UPSERT to create if new, update if exists (prevents duplicate errors)
    const { data: profile, error } = await supabaseAdmin
      .from("dj_profiles")
      .upsert(
        {
          user_id,
          email,
          dj_name: dj_name || email.split("@")[0], // Fallback to email username
          full_name: full_name || null,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[Create Profile API] Upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[Create Profile API] SUCCESS - Profile:", profile?.dj_name);

    // Send Welcome Email (non-blocking)
    const resend = getResend();
    if (resend && dj_name) {
      resend.emails.send({
        from: "Nostalgic <onboarding@resend.dev>",
        to: email,
        subject: "Welcome to Nostalgic Requests!",
        react: WelcomeEmail({ djName: dj_name }),
      }).catch(err => console.error("[Create Profile API] Email error:", err));
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("[Create Profile API] Exception:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

