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

    // 1. Logic to grab email from ANY source
    const userEmail = meta.customer_email || meta.requester_email || session.customer_details?.email || null;
    
    // 2. Parse Songs & Artwork
    let songs = [];
    try {
        songs = JSON.parse(meta.songs_json || "[]");
    } catch (e) { console.error("Error parsing songs_json", e); }
    
    if (songs.length === 0) songs = [{}];
    const primarySong = songs[0];

    // Art Fallback
    const artUrl = (meta.song_image && meta.song_image !== "") 
        ? meta.song_image 
        : primarySong.artworkUrl || "https://placehold.co/400?text=No+Art";
        
    const amountPaid = parseFloat(meta.amount_paid) || (session.amount_total || 0) / 100;

    // --- DB ACTION 1: Insert Request ---
    const { error: reqError } = await supabase.from("requests").insert({
      event_id: meta.event_id,
      song_title: primarySong.title || meta.song_title_display || "Unknown Title",
      song_artist: primarySong.artist || "Unknown Artist",
      song_album: primarySong.album || null,
      song_artwork_url: artUrl, // Safe fallback
      song_itunes_id: primarySong.id ? String(primarySong.id) : null,
      
      requester_name: meta.requester_name || session.customer_details?.name || "Anonymous",
      requester_phone: meta.requester_phone || null,
      requester_email: userEmail, // Valid Email captured
      
      amount_paid: amountPaid,
      stripe_payment_id: session.payment_intent as string,
      stripe_session_id: session.id,
      
      song_count: Number(meta.song_count) || 1,
      has_priority: meta.is_priority === "true",
      has_shoutout: meta.is_shoutout === "true",
      has_guaranteed_next: meta.is_guaranteed === "true",
      
      status: "pending",
      is_paid: true
    });

    if (reqError) {
        console.error("? CRITICAL: Request Insert Failed", reqError);
    } else {
        console.log("? Request Inserted");
    }

    // --- DB ACTION 2: Upsert Lead ---
    const phone = meta.requester_phone || session.customer_details?.phone;
    if (phone) {
        const { data: existingLead } = await supabase
          .from("leads")
          .select("*")
          .eq("phone", phone)
          .single();
    
        if (existingLead) {
          await supabase.from("leads").update({
            total_spent: (Number(existingLead.total_spent) || 0) + amountPaid,
            request_count: (existingLead.request_count || 0) + 1,
            last_seen_at: new Date().toISOString(),
            email: existingLead.email || userEmail // Enrich email if missing
          }).eq("id", existingLead.id);
        } else {
          await supabase.from("leads").insert({
            name: meta.requester_name,
            phone: phone,
            email: userEmail,
            total_spent: amountPaid,
            request_count: 1,
            first_seen_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString()
          });
        }
    }
  }

  return new Response("Received", { status: 200 });
}
