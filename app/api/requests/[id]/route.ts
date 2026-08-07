/**
 * Mark a song request playing / played from the live dashboard.
 *
 * The live dashboard used to run `supabase.from("requests").update({status})
 * .eq("id", id)` straight from the browser, with RLS deciding whether the DJ
 * owned it. Turso has no RLS and the browser holds no usable credential, so the
 * write moves here — and ownership has to be derived through the request's
 * event, since `requests` carries no user_id of its own.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireUser, ownedEvent } from "@/lib/require-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUS = new Set(["pending", "playing", "played"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { ctx } = auth;
  const { id } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const status = String(body?.status ?? "");
  if (!VALID_STATUS.has(status)) {
    return NextResponse.json(
      { error: `status must be one of ${[...VALID_STATUS].join(", ")}` },
      { status: 400 },
    );
  }

  // requests -> events -> user_id. Two hops, but the alternative is trusting an
  // id from the client.
  const { data: row, error: readErr } = await ctx.db
    .from("requests")
    .select("id, event_id")
    .eq("id", id)
    .maybeSingle();
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (!(await ownedEvent(ctx, (row as any).event_id, "id"))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const patch: Record<string, unknown> = { status };
  // played_at is what the dashboard's "recently played" ordering reads; setting
  // status without it leaves the row sorted by created_at forever.
  if (status === "played") patch.played_at = new Date().toISOString();

  const { data, error } = await ctx.db
    .from("requests")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data });
}
