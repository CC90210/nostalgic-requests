import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import QRCode from 'qrcode';

// Generate a URL-friendly slug
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);
  
  const random = Math.random().toString(36).substring(2, 8);
  return `${base}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const supabase = getSupabaseAdmin();
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json(events || []);
  } catch (error) {
    console.error('GET /api/events error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { name, venue_name, venue_address, start_time, end_time, event_type, custom_message } = body;

    // Validation
    if (!name || !venue_name || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: name, venue_name, start_time, end_time' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Generate unique slug
    const unique_slug = generateSlug(name);

    // Get the app URL for QR code
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const portalUrl = `${appUrl}/e/${unique_slug}`;

    // Generate QR code as data URL
    let qr_code_url: string | null = null;
    try {
      qr_code_url = await QRCode.toDataURL(portalUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#FFFFFF',
          light: '#0A0A0B',
        },
      });
    } catch (qrError) {
      console.error('QR code generation failed:', qrError);
      // Continue without QR code - we can generate it later
    }

    // Insert event into database
    const { data: event, error: insertError } = await supabase
      .from('events')
      .insert({
        name,
        venue_name,
        venue_address: venue_address || null,
        start_time,
        end_time,
        event_type: event_type || 'other',
        custom_message: custom_message || null,
        base_price: 5.00,
        status: 'draft',
        unique_slug,
        qr_code_url,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create event:', insertError);
      return NextResponse.json(
        { error: insertError.message || 'Failed to create event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...event,
      portal_url: portalUrl,
    });
  } catch (error) {
    console.error('POST /api/events error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
