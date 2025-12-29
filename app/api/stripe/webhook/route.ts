import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata!;
    const supabase = getSupabaseAdmin();

    const songs = JSON.parse(metadata.songs);
    const primarySong = songs[0];

    // Create request record
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .insert({
        event_id: metadata.eventId,
        song_title: primarySong.title,
        song_artist: primarySong.artist,
        song_album: primarySong.album || null,
        song_artwork_url: primarySong.artworkUrl || null,
        song_preview_url: primarySong.previewUrl || null,
        song_itunes_url: primarySong.itunesUrl || null,
        song_itunes_id: primarySong.id || null,
        requester_name: metadata.requesterName || null,
        requester_phone: metadata.requesterPhone,
        requester_email: metadata.requesterEmail || null,
        amount_paid: (session.amount_total || 0) / 100,
        stripe_payment_id: session.payment_intent as string,
        stripe_session_id: session.id,
        song_count: songs.length,
        has_priority: metadata.priority === 'true',
        has_shoutout: metadata.shoutout === 'true',
        has_guaranteed_next: metadata.guaranteedNext === 'true',
        status: 'pending',
      })
      .select()
      .single();

    if (requestError) {
      console.error('Failed to create request:', requestError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Upsert lead record
    const { error: leadError } = await supabase
      .from('leads')
      .upsert(
        {
          phone: metadata.requesterPhone,
          name: metadata.requesterName || null,
          email: metadata.requesterEmail || null,
          total_spent: (session.amount_total || 0) / 100,
          request_count: 1,
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: 'phone',
          ignoreDuplicates: false,
        }
      );

    if (!leadError) {
       const { error: rpcError } = await supabase.rpc('increment_lead_stats', {
        p_phone: metadata.requesterPhone,
        p_amount: (session.amount_total || 0) / 100,
      });
      if (rpcError) console.error('RPC Error', rpcError);
    }

    console.log('Request created:', requestData?.id);
  }

  return NextResponse.json({ received: true });
}
