import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateTotal, DEFAULT_PRICING, PricingConfig } from "@/lib/pricing";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
        eventId, 
        songs, 
        package: packageType, 
        addons, 
        requesterName, 
        requesterPhone, 
        requesterEmail 
    } = body;

    // 1. Fetch Event Pricing
    const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("price_single, price_double, price_party, price_priority, price_shoutout, price_guaranteed")
        .eq("id", eventId)
        .single();
    
    // Fallback to default if columns missing or null
    const pricingConfig: PricingConfig = {
        price_single: eventData?.price_single ?? DEFAULT_PRICING.price_single,
        price_double: eventData?.price_double ?? DEFAULT_PRICING.price_double,
        price_party: eventData?.price_party ?? DEFAULT_PRICING.price_party,
        price_priority: eventData?.price_priority ?? DEFAULT_PRICING.price_priority,
        price_shoutout: eventData?.price_shoutout ?? DEFAULT_PRICING.price_shoutout,
        price_guaranteed: eventData?.price_guaranteed ?? DEFAULT_PRICING.price_guaranteed,
    };

    // Server-side Price Calculation
    const amountPaid = calculateTotal({ package: packageType, addons }, pricingConfig);
    const primarySong = songs[0] || {};

    // 2. Insert Draft
    const { data, error } = await supabase.from("requests").insert({
        event_id: eventId,
        song_title: primarySong.title || "Unknown",
        song_artist: primarySong.artist || "Unknown",
        song_album: primarySong.album || null,
        song_artwork_url: primarySong.artworkUrl || "https://placehold.co/400?text=No+Art",
        song_itunes_id: primarySong.id ? String(primarySong.id) : null,
        requester_name: requesterName || "Anonymous",
        requester_phone: requesterPhone || null,
        requester_email: requesterEmail || null,
        amount_paid: amountPaid,
        song_count: songs.length,
        has_priority: addons?.priority || false,
        has_shoutout: addons?.shoutout || false,
        has_guaranteed_next: addons?.guaranteedNext || false,
        
        status: "pending", 
        is_paid: false 
    }).select("id").single();

    if (error) {
        console.error("? Draft Insert Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requestId: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
