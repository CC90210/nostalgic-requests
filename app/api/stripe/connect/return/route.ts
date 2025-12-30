import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // Update Profile Status
    const { error } = await supabase
        .from("dj_profiles")
        .update({ stripe_onboarding_complete: true })
        .eq("user_id", userId);

    if (error) {
        console.error("Failed to update onboarding status", error);
    }

    // Redirect to Dashboard Settings
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nostalgic-requests.vercel.app";
    return NextResponse.redirect(`${appUrl}/dashboard/settings?onboarding=success`);

  } catch (error: any) {
    console.error("Return API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
