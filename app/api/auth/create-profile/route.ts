import { getAdminData } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { getResend } from "@/lib/resend";
import WelcomeEmail from "@/emails/WelcomeEmail";

/**
 * Create the SIGNED-IN user's own profile.
 *
 * Identity comes from the session. This handler previously took `user_id` and
 * `email` straight off the request body and upserted through the service-role
 * client with no session check, so an unauthenticated POST could overwrite any
 * DJ's profile row — name, phone, email — by guessing their user id. Its
 * siblings (get-profile, user/update, stripe/connect) were hardened on
 * 2026-08-16; this one was missed.
 *
 * The body is still parsed, and its profile CONTENT is still used, but the
 * identity fields in it are ignored.
 *
 * Note: under Turso auth, signup creates the profile server-side in the same
 * transaction as the auth user (see api/auth/turso-signup), so this route is
 * now only the Supabase-auth path's profile step.
 */
export async function POST(request: NextRequest) {
  console.log("[Create Profile API] Request received");

  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.res;

    const user_id = auth.ctx.user.id;
    const email = auth.ctx.user.email;

    const body = await request.json();
    const { dj_name, phone, full_name } = body;

    if (!email) {
      return NextResponse.json({ error: "Session has no email" }, { status: 400 });
    }

    const supabaseAdmin = getAdminData();

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

