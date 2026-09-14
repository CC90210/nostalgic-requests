import { adminData as supabase } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { isPlatformOwner } from "@/lib/platform";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe Connect onboarding for the SIGNED-IN DJ.
 *
 * Identity comes from the session, never from the request body. Until
 * 2026-08-16 this handler read `userId` and `email` off `req.json()` and ran
 * every query through the service-role client with no session check at all, so
 * an unauthenticated POST could mint an Express onboarding link bound to any
 * DJ's payout account — and the platform-owner guard compared an email supplied
 * by the same caller, so omitting `email` skipped it entirely.
 *
 * `stripe/checkout/route.ts` already did this correctly (it resolves the email
 * from the auth record, then calls isPlatformOwner). This route now matches.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.res;

    const userId = auth.ctx.user.id;
    const email = auth.ctx.user.email;

    // SUPER ADMIN BLOCK — the email is the session's, so this cannot be skipped
    // by omitting a field.
    if (isPlatformOwner(email)) {
        console.log("Platform Owner attempted Connect. Blocking.");
        return NextResponse.json({ error: "Platform Owner cannot connect as a sub-account." }, { status: 400 });
    }

    // 1. Get Profile
    const initial = await supabase
      .from("dj_profiles")
      .select("stripe_account_id, email, dj_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (initial.error) {
      // Turso returns errors, it never throws them. Discarding this made a
      // failed query indistinguishable from a missing profile, which then sent
      // a real DJ down the self-heal path and renamed them "New DJ".
      console.error("[Connect] Profile lookup failed:", initial.error.message);
      return NextResponse.json({ error: "Could not load your profile." }, { status: 500 });
    }

    let profile: any = initial.data;

    // SELF HEALING PROTOCOL
    if (!profile) {
      console.log(`[Connect] Profile missing for ${userId}. Initiating Self-Healing...`);
      // INSERT, not upsert. An upsert keyed on user_id rewrites every column it
      // is handed, so a racing second request would stamp the literal "New DJ"
      // over a name the DJ had already chosen.
      const { data: newProfile, error: createError } = await supabase
        .from("dj_profiles")
        .insert({
            user_id: userId,
            email: email || undefined,
            dj_name: "New DJ"
        })
        .select()
        .single();

      if (createError) {
        // Losing the insert race is not a failure — re-read the winning row.
        const { data: raced } = await supabase
          .from("dj_profiles")
          .select("stripe_account_id, email, dj_name")
          .eq("user_id", userId)
          .maybeSingle();

        if (!raced) {
          console.error("Self-healing failed:", createError.message);
          return NextResponse.json({ error: "Failed to create profile automatically." }, { status: 500 });
        }
        profile = raced;
      } else {
        profile = newProfile;
      }
    }

    // Initialize Stripe Server-Side.
    //
    // Was `require("stripe")` followed by `new Stripe(...)`. Because it sits
    // inside the handler it never broke the build the way the webhook and
    // connect/return copies did — but it is the same defect class, it bypasses
    // the apiVersion every other route is pinned to, and a CommonJS require is a
    // poor fit for the Workers bundle. getStripe() is what this repo's
    // CLAUDE.md mandates: "never call new Stripe() directly".
    const stripeServer = getStripe();

    let accountId = profile.stripe_account_id;

    // 2. Create Stripe Account if missing
    if (!accountId) {
      try {
          const account = await stripeServer.accounts.create({
            type: "express",
            // Was hardcoded. Default is unchanged so nobody's behaviour shifts
            // under them, but the platform account is CAD — onboarding a
            // Canadian DJ needs this set, not a code change.
            country: process.env.STRIPE_CONNECT_COUNTRY || "US",
            email: profile.email || undefined,
            capabilities: {
              card_payments: { requested: true }, // REQUIRED for transfers to work
              transfers: { requested: true },
            },
            business_profile: {
              name: profile.dj_name || "DJ Platform User",
            },
            // Lets the account.updated webhook find the owner directly.
            metadata: { user_id: userId },
          }, {
            // A double-click used to mint a SECOND Express account and orphan
            // the first. Keyed on the user, so a retry returns the same one.
            idempotencyKey: `connect_account_${userId}`,
          });
          accountId = account.id;

          // Save to DB
          const { error: saveError } = await supabase
            .from("dj_profiles")
            .update({ stripe_account_id: accountId })
            .eq("user_id", userId);

          if (saveError) {
            // The account now exists at Stripe but we failed to record it.
            // Stop: handing over an onboarding link for an account this
            // platform has already forgotten wastes the DJ's whole signup.
            console.error("[Connect] Failed to save stripe_account_id:", saveError.message);
            return NextResponse.json(
              { error: "Could not save your payment account. Please try again." },
              { status: 500 }
            );
          }

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
        // The old fallback pointed at a Vercel domain this app no longer
        // deploys to; the site runs on Cloudflare Workers at its own domain.
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nostalgicrequests.com";
        const refreshUrl = `${appUrl}/dashboard/settings?onboarding=canceled`;
        // No user_id in the URL any more — the return route reads the session.
        const returnUrl = `${appUrl}/api/stripe/connect/return`;

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
