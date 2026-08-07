/**
 * A single event: read it, change it, delete it — ownership checked every time.
 *
 * These were 410 stubs deferring to RLS. With RLS gone, `update().eq("id", …)`
 * from the browser would have become "any DJ may edit any event by id", so the
 * check moves here.
 *
 * PATCH takes an allowlist rather than the request body. A pass-through update
 * would let a caller set user_id (hand the event to someone else, or steal one)
 * or unique_slug (collide with another DJ's public URL) — the same class of
 * hole that made PropFlow's bridge need a column denylist.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireUser, ownedEvent } from "@/lib/require-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EDITABLE_TEXT = new Set([
  "name",
  "venue_name",
  "venue_address",
  "custom_message",
  "event_type",
]);
const EDITABLE_PRICE = new Set([
  "price_single",
  "price_double",
  "price_party",
  "price_priority",
  "price_shoutout",
  "price_guaranteed",
]);
const EDITABLE_TIME = new Set(["start_time", "end_time"]);
const VALID_STATUS = new Set(["draft", "live", "ended"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { id } = await params;

  const event = await ownedEvent(auth.ctx, id);
  if (!event) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: requests, error } = await auth.ctx.db
    .from("requests")
    .select("amount_paid, status")
    .eq("event_id", id)
    .eq("is_paid", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = requests ?? [];
  return NextResponse.json({
    event,
    stats: {
      totalRequests: rows.length,
      // amount_paid is TEXT (numeric never becomes a float), so this must be
      // Number()'d or the reduce concatenates strings.
      totalRevenue: rows.reduce((s: number, r: any) => s + Number(r.amount_paid || 0), 0),
      pendingRequests: rows.filter((r: any) => r.status === "pending").length,
      playedRequests: rows.filter((r: any) => r.status === "played").length,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { ctx } = auth;
  const { id } = await params;

  if (!(await ownedEvent(ctx, id, "id"))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  const rejected: string[] = [];
  for (const [k, v] of Object.entries(body ?? {})) {
    if (EDITABLE_TEXT.has(k)) {
      patch[k] = v === null ? null : String(v);
    } else if (EDITABLE_PRICE.has(k)) {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: `${k} must be a number >= 0` }, { status: 400 });
      }
      patch[k] = n;
    } else if (EDITABLE_TIME.has(k)) {
      const s = String(v);
      if (Number.isNaN(Date.parse(s))) {
        return NextResponse.json({ error: `${k} is not a valid date` }, { status: 400 });
      }
      patch[k] = s;
    } else if (k === "status") {
      const s = String(v);
      if (!VALID_STATUS.has(s)) {
        return NextResponse.json(
          { error: `status must be one of ${[...VALID_STATUS].join(", ")}` },
          { status: 400 },
        );
      }
      patch[k] = s;
    } else {
      rejected.push(k);
    }
  }

  // Silently dropping user_id/unique_slug would let a caller believe the write
  // landed. Say no out loud instead.
  if (rejected.length) {
    return NextResponse.json(
      { error: `field(s) not editable: ${rejected.join(", ")}` },
      { status: 400 },
    );
  }
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "no editable fields supplied" }, { status: 400 });
  }

  const { data, error } = await ctx.db
    .from("events")
    .update(patch)
    .eq("id", id)
    .eq("user_id", ctx.user.id) // belt-and-braces: scope the write itself
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { ctx } = auth;
  const { id } = await params;

  if (!(await ownedEvent(ctx, id, "id"))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Paid requests are financial records tied to a Stripe charge. Postgres had
  // ON DELETE CASCADE from requests.event_id; deleting the event would take the
  // receipts with it. Refuse instead — the UI offers "End Event" for this.
  const { data: paid, error: paidErr } = await ctx.db
    .from("requests")
    .select("id")
    .eq("event_id", id)
    .eq("is_paid", true)
    .limit(1);
  if (paidErr) return NextResponse.json({ error: paidErr.message }, { status: 500 });
  if (paid && paid.length) {
    return NextResponse.json(
      {
        error:
          "This event has paid requests and cannot be deleted — they are payment " +
          "records. End the event instead.",
      },
      { status: 409 },
    );
  }

  const { error } = await ctx.db
    .from("events")
    .delete()
    .eq("id", id)
    .eq("user_id", ctx.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
