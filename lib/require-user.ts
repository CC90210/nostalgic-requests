/**
 * One place that answers "who is calling, and which client should serve them?"
 *
 * Every DJ-facing surface used to lean on RLS: the browser held an anon key and
 * Postgres decided what it could see. Turso has no RLS and its token is a
 * full-database credential, so that boundary has to move into the server —
 * which means one resolver, used by every route, rather than an ownership check
 * re-derived per file.
 *
 * Both backends stay live here on purpose. Supabase keeps serving until the
 * subscription is actually cancelled; flipping EMPIRE_AUTH_BACKEND switches the
 * session source without a second code path for callers to get wrong.
 */
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminData } from "@/lib/supabase-admin";
import { getTursoUser } from "@/lib/turso-session";

export type SessionUser = { id: string; email?: string };

export type Resolved = {
  user: SessionUser;
  /**
   * Turso mode: the admin client, so every query MUST carry its own ownership
   * filter. Supabase mode: the request-scoped client, so RLS still applies and
   * those same filters are defence in depth.
   */
  db: SupabaseClient;
};

/** null means "not signed in" — callers turn that into a 401. */
export async function resolveUser(): Promise<Resolved | null> {
  const tursoUser = await getTursoUser();
  if (tursoUser) {
    return { user: tursoUser, db: getAdminData() };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const store = await cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => store.getAll(),
      // Route handlers here only read the session; refresh happens in
      // middleware. Writing cookies from a Server Component throws.
      setAll: () => {},
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { user: { id: user.id, email: user.email }, db: supabase };
}

/** Route-handler form: returns either the session or the 401 to return. */
export async function requireUser(): Promise<
  { ok: true; ctx: Resolved } | { ok: false; res: NextResponse }
> {
  const ctx = await resolveUser();
  if (!ctx) {
    return {
      ok: false,
      res: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, ctx };
}

/**
 * Confirm this user owns this event before anything reads or writes through it.
 *
 * Returns the event row (so callers do not re-fetch) or null. The user_id
 * filter is applied in the query rather than compared after the fact — an
 * ownership check that runs on already-fetched data still leaked the row to the
 * server, and it is one refactor away from leaking it to the client.
 */
export async function ownedEvent(
  ctx: Resolved,
  eventId: string,
  columns = "*",
): Promise<any | null> {
  if (!eventId) return null;
  const { data, error } = await ctx.db
    .from("events")
    .select(columns)
    .eq("id", eventId)
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}
