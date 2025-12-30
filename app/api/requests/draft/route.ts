import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateTotal } from "@/lib/pricing";

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

    // Server-side Price Calculation
    const amountPaid = calculateTotal({ package: packageType, addons });
    const primarySong = songs[0] || {};

    // 1. DRAFT INSERT (Pending Order)
    const { data, error } = await supabase.from("requests").insert({
        event_id: eventId,
        song_title: primarySong.title || "Unknown",
        song_artist: primarySong.artist || "Unknown",
        song_album: primarySong.album || null,
        song_artwork_url: primarySong.artworkUrl || "https://placehold.co/400?text=No+Art",
        song_itunes_id: primarySong.id ? String(primarySong.id) : null,
        requester_name: requesterName || "Anonymous",
        requester_phone: requesterPhone || null,
        requester_email: requesterEmail || null, // Confirmed column exists
        amount_paid: amountPaid,
        song_count: songs.length,
        has_priority: addons?.priority || false,
        has_shoutout: addons?.shoutout || false,
        has_guaranteed_next: addons?.guaranteedNext || false,
        
        // NEW SCHEMA FIELDS
        status: "pending", 
        is_paid: false 
    }).select("id").single();

    if (error) {
        console.error("? Draft Insert Error:", error);
        if (error.code === '42703') { // Postgres undefined_column
             return NextResponse.json({ error: "CRITICAL: Database Schema Mismatch - Run SQL Migrations." }, { status: 500 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requestId: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
