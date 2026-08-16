import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { getAdminData } from "@/lib/supabase-admin";

/**
 * The signed-in DJ's own profile.
 *
 * Identity comes from the session. Until 2026-08-16 this handler took `user_id`
 * from the request body and queried through the service-role client with no
 * session check, so an unauthenticated POST returned any DJ's full profile row
 * for a guessed id. It also logged five other DJs' user_id/email/dj_name to the
 * server console on a miss, as a debugging aid — that listing is gone; a
 * "profile not found" answer never needed other people's records to produce.
 *
 * The body is still parsed and ignored so existing clients that send
 * `{ user_id }` keep working unchanged; the value is simply not trusted.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.res;

    const userId = auth.ctx.user.id;
    const supabaseAdmin = getAdminData();

    const { data: profile, error } = await supabaseAdmin
      .from("dj_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      // Log the detail, return a generic message: the raw driver error names
      // columns and constraints the caller has no business seeing.
      console.error("[Get Profile API] Database error:", error.message, error.code);
      return NextResponse.json({ error: "Could not load profile" }, { status: 500 });
    }

    return NextResponse.json({ profile: profile ?? null });
  } catch (error: any) {
    console.error("[Get Profile API] Exception:", error?.message);
    return NextResponse.json({ error: "Could not load profile" }, { status: 500 });
  }
}
