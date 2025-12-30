import { NextRequest, NextResponse } from "next/server";
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

    // SUPER ADMIN BLOCK
    if (email && email.toLowerCase() === "konamak@icloud.com") {
        console.log("Platform Owner attempted Connect. Blocking.");
        return NextResponse.json({ error: "Platform Owner cannot connect as a sub-account." }, { status: 400 });
    }

    // 1. Get Profile
    let { data: profile } = await supabase
      .from("dj_profiles")
      .select("stripe_account_id, email, dj_name")
      .eq("user_id", userId)
      .single();

    // SELF HEALING PROTOCOL
    if (!profile) {
      console.log(`[Connect] Profile missing for ${userId}. Initiating Self-Healing...`);
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
        return NextResponse.json({ error: "Failed to create profile automatically." }, { status: 500 });
      }
      profile = newProfile;
    }

    // Initialize Stripe Server-Side
    const Stripe = require("stripe");
    const stripeServer = new Stripe(process.env.STRIPE_SECRET_KEY!);

    let accountId = profile.stripe_account_id;

    // 2. Create Stripe Account if missing
    if (!accountId) {
      try {
          const account = await stripeServer.accounts.create({
            type: "express",
            country: "US", // Default
            email: profile.email || undefined,
            capabilities: {
              card_payments: { requested: true }, // REQUIRED for transfers to work
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

      } catch (stripeErr: any) {
          console.error("Stripe Account Creation Failed:", stripeErr);
          return NextResponse.json(
              { error: `Stripe Configuration Error: ${stripeErr.message}` }, 
              { status: 400 }
          );
      }
    }

    // 3. Create Account Link (Onboarding)
    try {
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
    } catch (linkErr: any) {
         console.error("Stripe Link Creation Failed:", linkErr);
         return NextResponse.json(
            { error: `Stripe Link Error: ${linkErr.message}` }, 
            { status: 400 }
        );
    }

  } catch (error: any) {
    console.error("Stripe Connect Fatal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
