import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Input Validation Schema
const checkoutSchema = z.object({
  requestId: z.string().uuid(),
  eventSlug: z.string().min(1).max(100),
  requesterEmail: z.string().email().max(254).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate Input
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const { requestId, eventSlug, requesterEmail } = validation.data;
    const stripe = getStripe();

    // 2. Fetch Draft Request
    const { data: reqData, error: reqError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (reqError || !reqData) {
      console.error("Checkout: Request not found", requestId);
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // 3. Fetch Event -> DJ
    const { data: eventData } = await supabase
      .from("events")
      .select("user_id")
      .eq("id", reqData.event_id)
      .single();

    let destinationAccount = null;
    let isPlatformOwner = false;
    let djEmail = "";

    if (eventData?.user_id) {
      // A. AUTH CHECK (Source of Truth)
      const { data: userData } = await supabase.auth.admin.getUserById(eventData.user_id);

      if (userData?.user?.email) {
        djEmail = userData.user.email;
        // CHECK PLATFORM OWNER BY EMAIL
        if (djEmail.toLowerCase().trim() === "konamak@icloud.com") {
          isPlatformOwner = true;
          destinationAccount = "PLATFORM_OWNER"; // Valid Bypass
        }
      }

      // B. STRIPE PROFILE CHECK (If not owner)
      if (!isPlatformOwner) {
        const { data: profile } = await supabase
          .from("dj_profiles")
          .select("stripe_account_id, stripe_onboarding_complete")
          .eq("user_id", eventData.user_id)
          .single();

        if (profile?.stripe_account_id && profile?.stripe_onboarding_complete) {
          destinationAccount = profile.stripe_account_id;
        }
      }
    }

    // SAFETY CHECK
    if (!destinationAccount) {
      return NextResponse.json(
        { error: "Payment setup incomplete for this event." },
        { status: 400 }
      );
    }

    // 4. Create Stripe Session
    const amount = reqData.amount_paid;
    let description = "Song Request";
    if (reqData.has_priority) description += " + Priority";
    if (reqData.has_shoutout) description += " + Shoutout";
    if (reqData.has_guaranteed_next) description += " + Guaranteed Next";

    const sessionParams: any = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Request: ${reqData.song_title}`,
              description: description,
              images: reqData.song_artwork_url ? [reqData.song_artwork_url] : [],
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        request_id: requestId,
        event_slug: eventSlug || "unknown",
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventSlug}/success?session_id={CHECKOUT_SESSION_ID}&song=${encodeURIComponent(reqData.song_title)}&artist=${encodeURIComponent(reqData.song_artist)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventSlug}`,
      customer_email: requesterEmail || reqData.requester_email || undefined,
    };

    // TRANSFER LOGIC
    if (!isPlatformOwner) {
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: destinationAccount,
        },
        application_fee_amount: Math.round(amount * 100 * 0.05), // 5% Fee
      };
    }

    try {
      const session = await stripe.checkout.sessions.create(sessionParams);
      return NextResponse.json({ url: session.url, sessionId: session.id });
    } catch (stripeErr: any) {
      console.error("Stripe Session Error:", stripeErr);
      return NextResponse.json({ error: "Transaction initiation failed." }, { status: 400 });
    }

  } catch (error: any) {
    console.error("[Checkout API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
