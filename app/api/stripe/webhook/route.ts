import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`? Webhook Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};

    console.log(`?? Webhook: Payment received for event ${meta.event_id}`);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Parse Songs
    let songs = [];
    try {
        songs = JSON.parse(meta.songs_json || "[]");
    } catch (e) { console.error("Error parsing songs_json", e); }
    
    // Fallback if empty array from JSON
    if (songs.length === 0) {
        songs = [{
            title: "Unknown Song",
            artist: "Unknown Artist",
            artworkUrl: "",
        }];
    }

    const primarySong = songs[0];
    const amountPaid = parseFloat(meta.amount_paid) || (session.amount_total || 0) / 100;

    // --- DB ACTION 1: Insert Request ---
    const { error: reqError } = await supabase.from("requests").insert({
      event_id: meta.event_id,
      // Song Info
      song_title: primarySong.title,
      song_artist: primarySong.artist,
      song_album: primarySong.album || null,
      song_artwork_url: primarySong.artworkUrl || null,
      song_itunes_id: primarySong.id ? String(primarySong.id) : null,
      // Requester Info
      requester_name: meta.requester_name,
      requester_phone: meta.requester_phone,
      requester_email: meta.requester_email || null,
      // Payment Info
      amount_paid: amountPaid,
      stripe_payment_id: session.payment_intent as string,
      stripe_session_id: session.id,
      // Package Info
      song_count: Number(meta.song_count) || 1,
      has_priority: meta.is_priority === "true",
      has_shoutout: meta.is_shoutout === "true",
      has_guaranteed_next: meta.is_guaranteed === "true",
      // Status
      status: "pending",
      is_paid: true
    });

    if (reqError) {
        console.error("? DB Insert Request Error:", reqError);
        // We log but continue, because we might still want to update Lead stats?
        // Actually if request fails, it is critical.
    } else {
        console.log("? Request Inserted");
    }

    // --- DB ACTION 2: Upsert Lead ---
    if (meta.requester_phone) {
        // Check existing lead
        const { data: existingLead } = await supabase
          .from("leads")
          .select("*")
          .eq("phone", meta.requester_phone)
          .single();
    
        if (existingLead) {
          // Update existing
          await supabase.from("leads").update({
            total_spent: (Number(existingLead.total_spent) || 0) + amountPaid,
            request_count: (existingLead.request_count || 0) + 1,
            last_seen_at: new Date().toISOString()
          }).eq("id", existingLead.id);
          console.log("? Lead Updated");
        } else {
          // Insert new
          await supabase.from("leads").insert({
            name: meta.requester_name,
            phone: meta.requester_phone,
            total_spent: amountPaid,
            request_count: 1,
            first_seen_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString()
          });
          console.log("? New Lead Created");
        }
    }
  }

  return new Response("Received", { status: 200 });
}
