import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { calculateTotal, PRICING } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    console.log("[Checkout API] Init");

    if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const stripe = getStripe();
    const body = await request.json();

    const {
      eventId,
      eventSlug,
      songs,
      package: packageType,
      addons,
      requesterName,
      requesterPhone,
      requesterEmail,
    } = body;

    const total = calculateTotal({ package: packageType, addons });
    const primarySong = songs[0] || {};
    
    // Package Description
    const packageInfo = PRICING.packages[packageType as keyof typeof PRICING.packages];
    let description = `${packageInfo.label} Package`;
    if (addons.priority) description += " + Priority";
    if (addons.shoutout) description += " + Shoutout";
    if (addons.guaranteedNext) description += " + Guaranteed Next";

    // Metadata Packing
    // CRITICAL: We map specific fields for the Webhook to use easily
    const metadata: any = {
      event_id: eventId,
      event_slug: eventSlug,
      requester_name: requesterName || "Anonymous",
      requester_phone: requesterPhone || "", 
      // Capture Email specifically as requested
      customer_email: requesterEmail || "",
      requester_email: requesterEmail || "", // Redundant buf safe
      
      package_type: packageType,
      is_priority: String(addons.priority || false),
      is_shoutout: String(addons.shoutout || false),
      is_guaranteed: String(addons.guaranteedNext || false),
      
      amount_paid: String(total),
      song_count: String(songs.length),
      
      // JSON Data
      songs_json: JSON.stringify(songs).substring(0, 450), 
      
      // Explicit fallback for artwork to ensure it exists in metadata if needed
      song_image: primarySong.artworkUrl || "",
      song_title_display: primarySong.title || "Unknown Song",
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Request: ${primarySong.title || "Song Request"}`,
              description: description,
              images: primarySong.artworkUrl ? [primarySong.artworkUrl] : [],
            },
            unit_amount: Math.round(total * 100),
          },
          quantity: 1,
        },
      ],
      metadata: metadata,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventSlug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventSlug}`,
      customer_email: requesterEmail || undefined,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });

  } catch (error: any) {
    console.error("[Checkout API] Stripe Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
