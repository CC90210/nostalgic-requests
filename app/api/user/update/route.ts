import { NextRequest, NextResponse } from "next/server";
import { adminData as supabase } from "@/lib/supabase-admin";
import { requireUser } from "@/lib/require-user";

/**
 * Update the SIGNED-IN DJ's own profile.
 *
 * The target user comes from the session. Until 2026-08-16 `userId` was read
 * from the request body and everything ran through the service-role client with
 * no session check, so an unauthenticated POST could overwrite any DJ's profile
 * row AND their Supabase auth user_metadata, with the victim chosen by a body
 * field.
 *
 * The remaining body fields are the caller's own profile content and stay
 * caller-supplied — they are destructured explicitly rather than spread, so a
 * client cannot smuggle extra columns into the upsert.
 */
export async function POST(req: NextRequest) {
    try {
        const auth = await requireUser();
        if (!auth.ok) return auth.res;

        const userId = auth.ctx.user.id;
        const body = await req.json();
        const { dj_name, full_name, phone, bio, profile_image_url } = body;

        // 1. Email comes from the session.
        //
        // This used to call supabase.auth.admin.getUserById(). Under the Turso
        // backend that reaches the absent-Supabase proxy, which THROWS, so
        // every single profile save returned 500 before touching the database.
        const email = auth.ctx.user.email;

        if (!email) {
            return NextResponse.json({ error: "Session has no email" }, { status: 400 });
        }

        // 2. Upsert Profile Row (DB)
        const { error: dbError } = await supabase.from("dj_profiles")
            .upsert({
                user_id: userId,
                email: email, // <-- FIX: Include Email
                dj_name,
                full_name,
                // `username` is deliberately NOT written here. It used to be
                // regenerated as "<name>-<random 0-999>" on every single save,
                // so a DJ's username changed each time they edited their bio.
                // Nothing in this codebase reads the column back.
                phone,
                bio,
                profile_image_url,
                updated_at: new Date().toISOString()
            }, { onConflict: "user_id" }); 
            // Note: Supabase-js upsert updates ALL columns provided in the object if conflict matches.

        if (dbError) {
            console.error("Profile DB Upsert Failed:", dbError);
            throw dbError;
        }

        // Step 4 used to mirror these fields into Supabase auth user_metadata.
        // Under Turso auth there is no Supabase auth user to mirror into and
        // the call throws; dj_profiles is the only record the UI reads anyway.

        return NextResponse.json({ success: true });
    } catch(err: any) {
        // Log the detail, return a generic message — the raw error names
        // columns and constraints the caller has no business seeing.
        console.error("Profile update failed (API):", err);
        return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
    }
}
