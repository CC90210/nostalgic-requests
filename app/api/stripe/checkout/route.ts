import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { calculateTotal, PRICING } from "@/lib/pricing";

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

    // 1. Fetch Draft Request from DB
    const { data: reqData, error } = await supabase
        .from("requests")
        .select("*")
        .eq("id", requestId)
        .single();
    
    if (error || !reqData) {
        return NextResponse.json({ error: "Invalid Request ID" }, { status: 404 });
    }

    // 2. Re-construct Description for Stripe
    const amount = reqData.amount_paid;
    let description = "Song Request";
    if (reqData.has_priority) description += " + Priority";
    if (reqData.has_shoutout) description += " + Shoutout";
    if (reqData.has_guaranteed_next) description += " + Guaranteed Next";

    // 3. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
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
        request_id: requestId, // THE GOLDEN KEY
        event_slug: eventSlug || "unknown", // For redirect fallback
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventSlug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventSlug}`,
      customer_email: requesterEmail || reqData.requester_email || undefined,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });

  } catch (error: any) {
    console.error("[Checkout API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
