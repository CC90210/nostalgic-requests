import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { calculateTotal, PRICING } from '@/lib/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: NextRequest) {
  try {
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

    // Build line items description
    const packageInfo = PRICING.packages[packageType as keyof typeof PRICING.packages];
    let description = `${packageInfo.label} (${packageInfo.songs} song${packageInfo.songs > 1 ? 's' : ''})`;
    
    const addonLabels: string[] = [];
    if (addons.priority) addonLabels.push('Priority Play');
    if (addons.shoutout) addonLabels.push('Shoutout');
    if (addons.guaranteedNext) addonLabels.push('Guaranteed Next');
    
    if (addonLabels.length > 0) {
      description += ` + ${addonLabels.join(', ')}`;
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: 'Song Request',
              description: description,
              images: songs[0]?.artworkUrl ? [songs[0].artworkUrl] : [],
            },
            unit_amount: Math.round(total * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        eventSlug,
        songs: JSON.stringify(songs),
        packageType,
        priority: addons.priority.toString(),
        shoutout: addons.shoutout.toString(),
        guaranteedNext: addons.guaranteedNext.toString(),
        requesterName: requesterName || 'Anonymous',
        requesterPhone,
        requesterEmail: requesterEmail || '',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventSlug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventSlug}`,
      payment_intent_data: {
        metadata: {
          eventId,
          requesterPhone,
        },
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
