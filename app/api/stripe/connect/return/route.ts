import { adminData as supabase } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { getStripe } from "@/lib/stripe";

/**
 * Where Stripe sends the DJ back at the end of Express onboarding.
 *
 * IDENTITY COMES FROM THE SESSION. This route used to take `user_id` straight
 * off the query string, so opening
 *   /api/stripe/connect/return?user_id=<somebody else>
 * marked THAT DJ's payouts as ready. Checkout trusts exactly this flag when it
 * decides where a fan's money goes, so a query parameter anyone could edit sat
 * directly upstream of a payment destination.
 *
 * READINESS IS charges_enabled AND payouts_enabled. It used to accept
 * `details_submitted` as good enough, but that only means the forms were
 * submitted — Stripe can still be holding the account for verification. Marking
 * such an account ready sends fans to a checkout that fails at payment time,
 * which is a worse failure than telling the DJ onboarding is still pending.
 *
 * This handler is now a convenience, not the source of truth: the
 * `account.updated` webhook is what actually keeps the flag current, since most
 * DJs finish verification long after they have closed this tab.
 */
// The Stripe client is built inside the handler via getStripe(). Constructed at
// module scope it ran during `next build`'s page-data collection, where there is
// no STRIPE_SECRET_KEY, and threw — the identical fault that failed the build at
// api/stripe/webhook.

// The old fallback pointed at a Vercel domain this app no longer deploys to.
function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://nostalgicrequests.com";
}

export async function GET(_req: NextRequest) {
  const base = baseUrl();

  try {
    const auth = await requireUser();
    if (!auth.ok) {
      // This is a browser redirect target, not an API call — a JSON 401 would
      // render as raw text in the DJ's tab. Send them to sign in instead.
      return NextResponse.redirect(`${base}/login`);
    }

    const userId = auth.ctx.user.id;

    const { data: profile, error: profileError } = await supabase
      .from("dj_profiles")
      .select("stripe_account_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[Connect Return] Profile lookup failed:", profileError.message);
      return NextResponse.redirect(`${base}/dashboard/settings?error=server_error`);
    }

    if (!profile?.stripe_account_id) {
      return NextResponse.redirect(`${base}/dashboard/settings?error=no_account_found`);
    }

    const account = await getStripe().accounts.retrieve(profile.stripe_account_id);
    const ready = Boolean(account.charges_enabled && account.payouts_enabled);

    // The live column is INTEGER: write 1/0 rather than a boolean and let the
    // value round-trip as itself instead of as a driver's best guess.
    const { error: updateError } = await supabase
      .from("dj_profiles")
      .update({ stripe_onboarding_complete: ready ? 1 : 0 })
      .eq("user_id", userId);

    if (updateError) {
      // Unchecked before. A failed write here left the DJ looking at a success
      // page while checkout carried on refusing their fans' money.
      console.error("[Connect Return] Readiness write failed:", updateError.message);
      return NextResponse.redirect(`${base}/dashboard/settings?error=server_error`);
    }

    return NextResponse.redirect(
      `${base}/dashboard/settings?onboarding=${ready ? "success" : "incomplete"}`
    );
  } catch (error: any) {
    console.error("[Connect Return] Error:", error?.message ?? error);
    return NextResponse.redirect(`${base}/dashboard/settings?error=server_error`);
  }
}
