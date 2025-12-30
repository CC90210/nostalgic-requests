import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const body = await request.json();
    const { requestId, eventSlug, requesterEmail } = body;

    if (!requestId) {
        return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    // 1. Fetch Draft Request
    const { data: reqData, error: reqError } = await supabase
        .from("requests")
        .select("*")
        .eq("id", requestId)
        .single();
    
    if (reqError || !reqData) {
        return NextResponse.json({ error: "Invalid Request ID" }, { status: 404 });
    }

    // 2. Fetch Event -> DJ -> Profile (Flow for Payouts)
    const { data: eventData } = await supabase
        .from("events")
        .select("user_id")
        .eq("id", reqData.event_id)
        .single();

    let destinationAccount = null;
    let isPlatformOwner = false;

    if (eventData?.user_id) {
        const { data: profile } = await supabase
            .from("dj_profiles")
            .select("stripe_account_id, stripe_onboarding_complete, email")
            .eq("user_id", eventData.user_id)
            .single();
        
        // CHECK SUPER ADMIN
        if (profile?.email && profile.email.toLowerCase() === "konamak@icloud.com") {
             isPlatformOwner = true;
             destinationAccount = "PLATFORM_OWNER"; // Bypass signal
        } else if (profile?.stripe_account_id && profile?.stripe_onboarding_complete) {
            destinationAccount = profile.stripe_account_id;
        }
    }

    // SAFETY CHECK: If DJ is not ready (and not Owner), DO NOT process payment.
    if (!destinationAccount) {
        console.error(`[Checkout] Aborted. DJ for Event ${reqData.event_id} is not onboarded.`);
        return NextResponse.json(
            { error: "This DJ is not yet set up to receive payments. Please try again later." },
            { status: 400 }
        );
    }

    // 3. Create Stripe Session
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
    if (isPlatformOwner) {
         // Direct Charge logic. No Transfer Data. No Fee.
         // Stripe funds go directly to the Platform Account Balance.
         console.log(`[Checkout] Processing Direct Charge for Platform Owner`);
    } else {
         // Connect Charge logic.
         sessionParams.payment_intent_data = {
            transfer_data: {
                destination: destinationAccount,
            },
            application_fee_amount: Math.round(amount * 100 * 0.05),
         };
    }

    try {
        const session = await stripe.checkout.sessions.create(sessionParams);
        return NextResponse.json({ url: session.url, sessionId: session.id });
    } catch (stripeErr: any) {
        console.error("Stripe Session Error:", stripeErr);
        if (stripeErr.code === "account_invalid") {
             return NextResponse.json({ error: "DJ Payout Account Invalid. Cannot process payment." }, { status: 400 });
        }
        throw stripeErr;
    }

  } catch (error: any) {
    console.error("[Checkout API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
