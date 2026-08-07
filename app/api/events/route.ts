/**
 * Events owned by the signed-in DJ.
 *
 * Was a 410 stub telling callers to "use the Supabase Client SDK for RLS
 * compliance". That instruction stops being true the moment RLS goes away: the
 * browser has no Turso credential it can safely hold, so creation and listing
 * come back to the server with an explicit user_id.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { ctx } = auth;

  const { data, error } = await ctx.db
    .from("events")
    .select("*")
    .eq("user_id", ctx.user.id)
    .order("start_time", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}

const PRICE_FIELDS = [
  "price_single",
  "price_double",
  "price_party",
  "price_priority",
  "price_shoutout",
  "price_guaranteed",
] as const;

const PRICE_FLOORS: Record<(typeof PRICE_FIELDS)[number], number> = {
  price_single: 5,
  price_double: 8,
  price_party: 12,
  price_priority: 10,
  price_shoutout: 5,
  price_guaranteed: 20,
};

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { ctx } = auth;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const name = String(body?.name ?? "").trim();
  const venue_name = String(body?.venue_name ?? "").trim();
  const venue_address = String(body?.venue_address ?? "").trim();
  const start_time = String(body?.start_time ?? "").trim();
  const end_time = String(body?.end_time ?? "").trim();
  const event_type = String(body?.event_type ?? "club").trim();

  if (!name || !venue_name || !venue_address || !start_time || !end_time) {
    return NextResponse.json(
      { error: "name, venue_name, venue_address, start_time and end_time are required" },
      { status: 400 },
    );
  }
  for (const [label, v] of [["start_time", start_time], ["end_time", end_time]] as const) {
    if (Number.isNaN(Date.parse(v))) {
      return NextResponse.json({ error: `${label} is not a valid date` }, { status: 400 });
    }
  }

  const prices: Record<string, number> = {};
  for (const f of PRICE_FIELDS) {
    const n = Number(body?.[f]);
    // A negative price is a refund the DJ never authorised; a NaN is a typo.
    prices[f] = Number.isFinite(n) && n >= 0 ? n : PRICE_FLOORS[f];
  }

  // Slug is minted server-side. Letting the client choose it invites collisions
  // with — and guesses at — another DJ's public portal URL.
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const unique_slug = `${cleanName || "event"}-${Math.random().toString(36).substring(2, 7)}`;

  const { data, error } = await ctx.db
    .from("events")
    .insert({
      user_id: ctx.user.id, // never from the body
      name,
      venue_name,
      venue_address,
      start_time,
      end_time,
      event_type,
      unique_slug,
      status: "draft",
      ...prices,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data }, { status: 201 });
}
