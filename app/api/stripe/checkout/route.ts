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
    
    // Package Description
    const packageInfo = PRICING.packages[packageType as keyof typeof PRICING.packages];
    let description = `${packageInfo.label} Package`;
    if (addons.priority) description += " + Priority";
    if (addons.shoutout) description += " + Shoutout";
    if (addons.guaranteedNext) description += " + Guaranteed Next";

    // Metadata Packing
    // Note: Stripe metadata values MUST be strings and limit is ~500 keys/chars.
    // We store the full JSON song list in 'songs_json' and summary in 'song_title'
    const primarySong = songs[0];
    const songSummary = songs.length > 1 
        ? `${primarySong.title} (+${songs.length - 1} others)`
        : primarySong.title;

    const metadata: any = {
      event_id: eventId,
      event_slug: eventSlug,
      requester_name: requesterName || "Anonymous",
      requester_phone: requesterPhone, // CRITICAL FOR LEADS
      requester_email: requesterEmail || "",
      package_type: packageType,
      is_priority: String(addons.priority || false),
      is_shoutout: String(addons.shoutout || false),
      is_guaranteed: String(addons.guaranteedNext || false), // Note key mapping
      amount_paid: String(total),
      song_count: String(songs.length),
      // Store full data needed for DB
      songs_json: JSON.stringify(songs).substring(0, 450), // Truncate safety
      // Summary fields for quick access
      song_title_display: songSummary,
      primary_artist: primarySong.artist,
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Request: ${songSummary}`,
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
