import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. Get Profile
    const { data: profile, error: profileError } = await supabase
      .from("dj_profiles")
      .select("stripe_account_id, email, dj_name")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const stripe = getStripe();
    let accountId = profile.stripe_account_id;

    // 2. Create Stripe Account if missing
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: profile.email || undefined,
        capabilities: {
          transfers: { requested: true },
        },
        business_profile: {
          name: profile.dj_name || "DJ Platform User",
        },
      });
      accountId = account.id;

      // Save to DB
      await supabase
        .from("dj_profiles")
        .update({ stripe_account_id: accountId })
        .eq("user_id", userId);
    }

    // 3. Create Account Link (Onboarding)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nostalgic-requests.vercel.app";
    const refreshUrl = `${appUrl}/dashboard/settings`; 
    const returnUrl = `${appUrl}/api/stripe/connect/return?user_id=${userId}`; 

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });

  } catch (error: any) {
    console.error("Stripe Connect Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
