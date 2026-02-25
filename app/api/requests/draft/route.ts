import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateTotal, PricingConfig, DEFAULT_PRICING } from "@/lib/pricing";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

// Use Service Role to Bypass RLS (for Public Event Check)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

// FIX 7: Input Validation Schema
const requestSchema = z.object({
    song_title: z.string().min(1).max(200).trim(),
    song_artist: z.string().min(1).max(200).trim(),
    requester_name: z.string().min(1).max(100).trim(),
    requester_phone: z.string().min(10).max(20).optional(),
    requester_email: z.string().email().max(254).optional(),
    event_id: z.string().uuid(),
    amount_paid: z.number().positive().max(1000),
});

// Input Validation Schema
const draftSchema = z.object({
    eventId: z.string().uuid(),
    songs: z.array(z.object({
        title: z.string().min(1).max(200),
        artist: z.string().min(1).max(200),
        artworkUrl: z.string().url().optional().or(z.literal("")),
    })).min(1).max(10),
    package: z.enum(["single", "double", "party"]),
    addons: z.object({
        priority: z.boolean().optional(),
        shoutout: z.boolean().optional(),
        guaranteedNext: z.boolean().optional(),
    }),
    requesterName: z.string().max(100).optional().or(z.literal("")),
    requesterPhone: z.string().max(50),
    requesterEmail: z.string().email().max(254).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const { allowed } = rateLimit(`draft_${ip}`, 10, 60000);
        if (!allowed) {
            return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
        }

        const body = await req.json();

        // 1. Validate Input
        const validation = draftSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        const { eventId, songs, addons, requesterName, requesterPhone, requesterEmail, package: pkg } = validation.data;

        // 2. Fetch Event + Pricing
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

        // 3. Calculate Price securely on Server
        const config: PricingConfig = {
            price_single: Number(event.price_single) || DEFAULT_PRICING.price_single,
            price_double: Number(event.price_double) || DEFAULT_PRICING.price_double,
            price_party: Number(event.price_party) || DEFAULT_PRICING.price_party,
            price_priority: Number(event.price_priority) || DEFAULT_PRICING.price_priority,
            price_shoutout: Number(event.price_shoutout) || DEFAULT_PRICING.price_shoutout,
            price_guaranteed: Number(event.price_guaranteed) || DEFAULT_PRICING.price_guaranteed,
        };

        const totalAmount = calculateTotal({ package: pkg, addons }, config);

        // 4. Flatten Songs
        const songTitles = songs.map(s => s.title).join(" | ").substring(0, 1000);
        const songArtists = songs.map(s => s.artist).join(" | ").substring(0, 1000);
        const artwork = songs[0]?.artworkUrl || null;

        // 5. Prepare Payload
        const payload = {
            event_id: eventId,
            song_title: songTitles,
            song_artist: songArtists,
            song_artwork_url: artwork,
            requester_name: requesterName,
            requester_phone: requesterPhone,
            requester_email: requesterEmail,
            amount_paid: totalAmount,
            has_priority: !!addons.priority,
            has_shoutout: !!addons.shoutout,
            has_guaranteed_next: !!addons.guaranteedNext,

            // FORCED FIELDS
            is_paid: false,
            status: "draft",
            stripe_payment_id: null,
            created_at: new Date().toISOString()
        };

        // FIX 7: Validate Payload Schema
        const reqValidation = requestSchema.safeParse(payload);
        if (!reqValidation.success) {
            return NextResponse.json({ 
                error: "Validation failed", 
                details: reqValidation.error.format() 
            }, { status: 400 });
        }

        // Insert Request 
        const { data, error } = await supabase.from("requests").insert(payload).select().single();

        if (error) {
            console.error("Draft Creation Error:", error);
            return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
        }

        return NextResponse.json({
            requestId: data.id,
            amount: totalAmount,
            success: true
        });

    } catch (e: any) {
        console.error("Draft API Exception:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}