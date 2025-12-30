import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nostalgic-requests.vercel.app";

    if (!userId) {
      return NextResponse.redirect(`${appUrl}/dashboard/settings?error=missing_user`);
    }

    // 1. Fetch Profile to get Account ID
    const { data: profile } = await supabase
        .from("dj_profiles")
        .select("stripe_account_id")
        .eq("user_id", userId)
        .single();
    
    if (!profile?.stripe_account_id) {
         return NextResponse.redirect(`${appUrl}/dashboard/settings?error=no_account_found`);
    }

    // 2. Verify with Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    if (account.charges_enabled) {
        // SUCCESS
        await supabase
            .from("dj_profiles")
            .update({ stripe_onboarding_complete: true })
            .eq("user_id", userId);
            
        return NextResponse.redirect(`${appUrl}/dashboard/settings?onboarding=success`);
    } else {
        // INCOMPLETE
        // They might have just closed the window or needs checking info
        // We do NOT mark as complete.
        return NextResponse.redirect(`${appUrl}/dashboard/settings?onboarding=incomplete`);
    }

  } catch (error: any) {
    console.error("Return API Error:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nostalgic-requests.vercel.app";
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=server_error`);
  }
}
