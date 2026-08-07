/**
 * Leads for the signed-in DJ.
 *
 * The leads page queried this from the browser with the anon key and a comment
 * reading "RLS Policies ensure we ONLY get leads where user_id == auth.uid()".
 * That was true and is no longer: without RLS the same query returns every DJ's
 * leads — names, phone numbers, emails and spend. The filter is now explicit and
 * server-side.
 */
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { ctx } = auth;

  const { data, error } = await ctx.db
    .from("leads")
    .select("*")
    .eq("user_id", ctx.user.id)
    .order("last_seen_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data ?? [] });
}
