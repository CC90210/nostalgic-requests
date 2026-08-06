/**
 * Paid requests for an event — the polling source for the live DJ dashboard
 * under Turso mode (Supabase Realtime replacement). Server-side via the admin
 * factory, so reads follow the data-plane switch like everything else.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTursoUser } from "@/lib/turso-session";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Event dashboards are DJ-only surfaces; require a session in Turso mode.
  const user = await getTursoUser();
  if (process.env.EMPIRE_AUTH_BACKEND === "turso" && !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
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
