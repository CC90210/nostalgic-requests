import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { calculateTotal, PRICING } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    console.log("[Checkout API] Init");

    // 1. Env Check
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[Checkout API] Missing STRIPE_SECRET_KEY");
      return NextResponse.json({ error: "Server misconfigured (Missing Stripe Key)" }, { status: 500 });
    }
    
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("[Checkout API] Missing NEXT_PUBLIC_APP_URL");
      return NextResponse.json({ error: "Server misconfigured (Missing App URL)" }, { status: 500 });
    }

    const stripe = getStripe();
    const body = await request.json();

    console.log("[Checkout API] Payload:", JSON.stringify(body, null, 2));

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

    // Validate Check
    if (!eventId || !songs || !packageType) {
       return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const total = calculateTotal({ package: packageType, addons });
    console.log("[Checkout API] Calculated Total:", total);

    // Build line items description
    const packageInfo = PRICING.packages[packageType as keyof typeof PRICING.packages];
    
    if (!packageInfo) {
        return NextResponse.json({ error: "Invalid package type" }, { status: 400 });
    }

    let description = `${packageInfo.label} (${packageInfo.songs} song${packageInfo.songs > 1 ? "s" : ""})`;
    
    const addonLabels: string[] = [];
    if (addons.priority) addonLabels.push("Priority Play");
    if (addons.shoutout) addonLabels.push("Shoutout");
    if (addons.guaranteedNext) addonLabels.push("Guaranteed Next");
    
    if (addonLabels.length > 0) {
      description += ` + ${addonLabels.join(", ")}`;
    }

    // Metadata Limits (Stripe has limit of 500 chars)
    const songMetadata = JSON.stringify(songs).substring(0, 450);

    // Create Stripe Checkout Session
    console.log("[Checkout API] Creating Stripe Session...");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // 'apple_pay', 'google_pay' handled automatically by 'card' usually, or explicit types
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd", // Changed to USD for broader compatibility
            product_data: {
              name: "Song Request",
              description: description,
              images: songs[0]?.artworkUrl ? [songs[0].artworkUrl] : [],
            },
            unit_amount: Math.round(total * 100), // Cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        eventSlug,
        songs: songMetadata,
        packageType,
        priority: addons.priority.toString(),
        shoutout: addons.shoutout.toString(),
        guaranteedNext: addons.guaranteedNext.toString(),
        requesterName: requesterName || "Anonymous",
        requesterPhone: requesterPhone || "",
        requesterEmail: requesterEmail || "",
      },
      // Ensure success_url includes https
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventSlug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventSlug}`,
      payment_intent_data: {
        metadata: {
          eventId,
          requesterPhone: requesterPhone || "",
        },
      },
      customer_email: requesterEmail || undefined, // Prefill email if present
    });

    console.log("[Checkout API] Session Created:", session.id);
    return NextResponse.json({ url: session.url, sessionId: session.id });

  } catch (error: any) {
    console.error("[Checkout API] Stripe Error:", error);
    // Return EXACT error from stripe for debugging
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
