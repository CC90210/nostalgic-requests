import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { isPlatformOwner } from "@/lib/platform";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const checkoutSchema = z.object({
  requestId: z.string().uuid(),
  eventSlug: z.string().min(1).max(100),
  requesterEmail: z.string().email().max(254).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = rateLimit(`checkout_${ip}`, 5, 60000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const body = await request.json();

    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const { requestId, eventSlug, requesterEmail } = validation.data;
    const stripe = getStripe();

    const { data: reqData, error: reqError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (reqError || !reqData) {
      console.error("Checkout: Request not found", requestId);
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const { data: eventData } = await supabase
      .from("events")
      .select("user_id")
      .eq("id", reqData.event_id)
      .single();

    let destinationAccount = null;
    let isPlatformOwnerCheck = false;
    let djEmail = "";

    if (eventData?.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(eventData.user_id);

      if (userData?.user?.email) {
        djEmail = userData.user.email;
        if (isPlatformOwner(djEmail)) {
          isPlatformOwnerCheck = true;
          destinationAccount = "PLATFORM_OWNER";
        }
      }

      if (!isPlatformOwnerCheck) {
        const { data: profile } = await supabase
          .from("dj_profiles")
          .select("stripe_account_id, stripe_onboarding_complete")
          .eq("user_id", eventData.user_id)
          .single();

        if (profile?.stripe_account_id && profile?.stripe_onboarding_complete) {
          destinationAccount = profile.stripe_account_id;
        } else {
          return NextResponse.json(
            { error: "This DJ hasn't set up payments yet. Please ask them to complete setup." },
            { status: 400 }
          );
        }
      }
    }

    if (!destinationAccount) {
      return NextResponse.json({ error: "Payment setup incomplete for this event." }, { status: 400 });
    }

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

    if (!isPlatformOwnerCheck) {
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
      return NextResponse.json({ error: "Transaction initiation failed." }, { status: 400 });
    }

  } catch (error: any) {
    console.error("[Checkout API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
