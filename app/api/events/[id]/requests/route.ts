/**
 * Paid requests for an event — the polling source for the live DJ dashboard
 * under Turso mode (Supabase Realtime replacement).
 *
 * The first version of this route checked only that SOMEONE was signed in, not
 * that the event was theirs. Under RLS that was survivable; with a service-role
 * client and no RLS it meant any authenticated DJ could read another DJ's paid
 * requests — including requester names, phone numbers and emails — by knowing
 * an event id. Ownership is now proven before the read.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireUser, ownedEvent } from "@/lib/require-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { id } = await params;

  if (!(await ownedEvent(auth.ctx, id, "id"))) {
    // 404 rather than 403: a DJ should not be able to probe which event ids
    // exist on other accounts.
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { data, error } = await auth.ctx.db
    .from("requests")
    .select("*")
    .eq("event_id", id)
    .eq("is_paid", true)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ requests: data ?? [] });
}
