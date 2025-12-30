import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getResend } from "@/lib/resend";
import WelcomeEmail from "@/emails/WelcomeEmail";

export async function POST(request: NextRequest) {
  console.log("[Create Profile API] Request received");
  
  try {
    const body = await request.json();
    const { user_id, email, dj_name, phone, full_name } = body;

    console.log("[Create Profile API] Data:", { user_id, email, dj_name, phone });

    if (!user_id || !email) {
      return NextResponse.json({ error: "Missing user_id or email" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // RETRY LOGIC: Wait for auth user to be fully committed
    let retries = 3;
    let profile = null;
    let lastError = null;

    while (retries > 0 && !profile) {
      try {
        // Small delay to let auth user commit
        if (retries < 3) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const { data, error } = await supabaseAdmin
          .from("dj_profiles")
          .upsert(
            {
              user_id,
              email,
              dj_name: dj_name || email.split("@")[0],
              full_name: full_name || null,
              phone: phone || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          )
          .select()
          .single();

        if (error) {
          lastError = error;
          console.log(`[Create Profile API] Attempt failed, ${retries - 1} retries left:`, error.message);
          retries--;
        } else {
          profile = data;
          console.log("[Create Profile API] SUCCESS:", profile?.dj_name);
        }
      } catch (err: any) {
        lastError = err;
        console.log(`[Create Profile API] Exception, ${retries - 1} retries left:`, err.message);
        retries--;
      }
    }

    if (!profile) {
      console.error("[Create Profile API] All retries failed:", lastError);
      return NextResponse.json({ error: lastError?.message || "Failed to create profile" }, { status: 500 });
    }

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
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

