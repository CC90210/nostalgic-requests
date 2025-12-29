import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';

export async function GET() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, venue_name, venue_address, start_time, end_time, event_type, custom_message, base_price } = body;

    // Generate unique slug
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Generate QR Code
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/e/${slug}`;
    const qrCodeDataUrl = await QRCode.toDataURL(portalUrl);

    const { data, error } = await supabase
      .from('events')
      .insert({
        name,
        venue_name,
        venue_address,
        start_time,
        end_time,
        event_type,
        custom_message,
        base_price,
        unique_slug: slug,
        qr_code_url: qrCodeDataUrl,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Event creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
