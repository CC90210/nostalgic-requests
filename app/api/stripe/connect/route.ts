import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Init Supabase Admin
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. Get Profile
    let { data: profile, error: profileError } = await supabase
      .from("dj_profiles")
      .select("stripe_account_id, email, dj_name")
      .eq("user_id", userId)
      .single();

    // SELF HEALING
    if (!profile) {
      console.log(`[Connect] Profile missing for ${userId}. Attempting self-healing...`);
      const { data: newProfile, error: createError } = await supabase
        .from("dj_profiles")
        .upsert({ 
            user_id: userId, 
            email: email || undefined, 
            dj_name: "New DJ" 
        }, { onConflict: "user_id" })
        .select()
        .single();

      if (createError) {
        console.error("Self-healing failed:", createError);
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
      }
      profile = newProfile;
    }

    const stripe = getStripe(); // This must return the Server SDK instance in this context? 
    // Usually getStripe() is for loadStripe (Client). 
    // I should use "new Stripe" here to be safe server-side, forcing secret key.
    // However, existing code might relying on it? 
    // I will replace getStripe() with explicit import to prevent Client/Server mismatch errors.
    const Stripe = require("stripe");
    const stripeServer = new Stripe(process.env.STRIPE_SECRET_KEY!);

    let accountId = profile.stripe_account_id;

    // 2. Create Stripe Account if missing
    if (!accountId) {
      const account = await stripeServer.accounts.create({
        type: "express",
        country: "US", // Default to US for MVP (Changeable later)
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
    const refreshUrl = `${appUrl}/dashboard/settings?onboarding=canceled`; 
    const returnUrl = `${appUrl}/api/stripe/connect/return?user_id=${userId}`; 

    const accountLink = await stripeServer.accountLinks.create({
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
