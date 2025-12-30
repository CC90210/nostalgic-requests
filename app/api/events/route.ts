import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 30);
  const random = Math.random().toString(36).substring(2, 8);
  return `${base}-${random}`;
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch events:", error);
      return NextResponse.json({ events: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
  } catch (error: any) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ events: [], error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
        name, venue_name, venue_address, start_time, end_time, event_type, custom_message,
        price_single, price_double, price_party, 
        price_priority, price_shoutout, price_guaranteed
    } = body;

    if (!name || !venue_name || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const unique_slug = generateSlug(name);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nostalgic-requests.vercel.app";
    const portalUrl = `${appUrl}/e/${unique_slug}`;

    let qr_code_url: string | null = null;
    try {
      qr_code_url = await QRCode.toDataURL(portalUrl, {
        width: 512,
        margin: 2,
        color: { dark: "#FFFFFF", light: "#0A0A0B" },
        errorCorrectionLevel: "H",
      });
    } catch (qrError) {
      console.error("QR code generation failed:", qrError);
    }

    const { data: event, error: insertError } = await supabase
      .from("events")
      .insert({
        name,
        venue_name,
        venue_address: venue_address || null,
        start_time,
        end_time,
        event_type: event_type || "other",
        custom_message: custom_message || null,
        status: "draft",
        unique_slug,
        qr_code_url,
        
        // Dynamic Pricing
        price_single: price_single || 5.00,
        price_double: price_double || 8.00,
        price_party: price_party || 12.00,
        price_priority: price_priority || 10.00,
        price_shoutout: price_shoutout || 5.00,
        price_guaranteed: price_guaranteed || 20.00,
        base_price: price_single || 5.00 // Legacy sync
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create event:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ...event, portal_url: portalUrl });
  } catch (error: any) {
    console.error("POST /api/events error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
