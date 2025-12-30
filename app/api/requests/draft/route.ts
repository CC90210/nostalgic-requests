import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use Service Role to Bypass RLS (for Public Event Check)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Verify Event is Eligible (Uses Service Role to read Event status)
        const { data: event, error: eventError } = await supabase
            .from("events")
            .select("status, user_id")
            .eq("id", body.event_id)
            .single();

        if (eventError || !event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (event.status === "draft") {
            return NextResponse.json({ error: "This event is not accepting requests yet." }, { status: 403 });
        }
        
        // 2. Prepare Payload
        const payload = {
            event_id: body.event_id,
            song_title: body.song_title,
            song_artist: body.song_artist,
            song_artwork_url: body.song_artwork_url,
            requester_name: body.requester_name,
            requester_phone: body.requester_phone,
            requester_email: body.requester_email,
            amount_paid: body.amount_paid,
            has_priority: body.has_priority || false,
            has_shoutout: body.has_shoutout || false,
            has_guaranteed_next: body.has_guaranteed_next || false,
            
            // FORCED FIELDS
            is_paid: false, 
            status: "draft",
            stripe_payment_id: null,
            created_at: new Date().toISOString()
        };
        
        // Insert Request (Service Role also bypasses RLS for Insert, which is fine here as we validated Event)
        const { data, error } = await supabase.from("requests").insert(payload).select().single();
        
        if (error) {
            console.error("Draft Creation Error:", error);
            throw error;
        }
        
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
