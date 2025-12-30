import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateTotal, PricingConfig, DEFAULT_PRICING } from "@/lib/pricing";

// Use Service Role to Bypass RLS (for Public Event Check)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // Map Client fields (camelCase) to variables
        const { eventId, songs, addons, requesterName, requesterPhone, requesterEmail } = body;
        const pkg = body.package; // "single" | "double" | "party"

        // Validation
        if (!eventId || !songs || !Array.isArray(songs) || songs.length === 0) {
             return NextResponse.json({ error: "Missing required fields (eventId or songs)" }, { status: 400 });
        }

        // 1. Fetch Event + Pricing
        const { data: event, error: eventError } = await supabase
            .from("events")
            .select("*")
            .eq("id", eventId)
            .single();

        if (eventError || !event) {
            console.error("Draft API: Event not found for ID:", eventId);
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (event.status === "draft") {
            return NextResponse.json({ error: "This event is not accepting requests yet." }, { status: 403 });
        }

        // 2. Calculate Price securely on Server
        const config: PricingConfig = {
            price_single: Number(event.price_single) || DEFAULT_PRICING.price_single,
            price_double: Number(event.price_double) || DEFAULT_PRICING.price_double,
            price_party: Number(event.price_party) || DEFAULT_PRICING.price_party,
            price_priority: Number(event.price_priority) || DEFAULT_PRICING.price_priority,
            price_shoutout: Number(event.price_shoutout) || DEFAULT_PRICING.price_shoutout,
            price_guaranteed: Number(event.price_guaranteed) || DEFAULT_PRICING.price_guaranteed,
        };

        const totalAmount = calculateTotal({ package: pkg, addons }, config);

        // 3. Flatten Songs (since DB row is per-request, but we handle bundles as single line item)
        // If "Party Pack", we store "Song A | Song B | Song C"
        const songTitles = songs.map((s: any) => s.title).join(" | ");
        const songArtists = songs.map((s: any) => s.artist).join(" | ");
        const artwork = songs[0]?.artworkUrl || null;

        // 4. Prepare Payload
        const payload = {
            event_id: eventId, // Correct DB Column
            song_title: songTitles,
            song_artist: songArtists,
            song_artwork_url: artwork,
            requester_name: requesterName,
            requester_phone: requesterPhone || "N/A", 
            requester_email: requesterEmail,
            amount_paid: totalAmount,
            has_priority: !!addons?.priority,
            has_shoutout: !!addons?.shoutout,
            has_guaranteed_next: !!addons?.guaranteedNext,
            
            // FORCED FIELDS
            is_paid: false, 
            status: "draft",
            stripe_payment_id: null,
            created_at: new Date().toISOString()
        };
        
        // Insert Request 
        const { data, error } = await supabase.from("requests").insert(payload).select().single();
        
        if (error) {
            console.error("Draft Creation Error:", error);
            throw error;
        }
        
        // Return structured data for Checkout
        return NextResponse.json({ 
            requestId: data.id, 
            amount: totalAmount,
            success: true 
        });

    } catch (e: any) {
        console.error("Draft API Exception:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
