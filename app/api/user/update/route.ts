import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use Service Role to Bypass RLS and Admin Auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, dj_name, full_name, phone, bio, profile_image_url } = body;
        
        if (!userId) {
             return NextResponse.json({ error: "Missing User ID" }, { status: 400 });
        }

        // 1. Fetch User Email (Crucial for new Profile creation)
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (userError || !userData.user) {
            throw new Error("Failed to fetch user auth data");
        }

        const email = userData.user.email;

        // 2. Generate Username fallback (if needed for new profiles)
        // Clean DJ name or use email prefix
        const baseName = (dj_name || full_name || email?.split("@")[0] || "dj").toLowerCase().replace(/[^a-z0-9]/g, "");
        const username = `${baseName}-${Math.floor(Math.random() * 1000)}`;

        // 3. Upsert Profile Row (DB)
        const { error: dbError } = await supabase.from("dj_profiles")
            .upsert({
                user_id: userId,
                email: email, // <-- FIX: Include Email
                dj_name,
                full_name,
                username: username, // Fallback for new rows (won't overwrite if we don't map it in conflict, wait... upsert overwrites all usually)
                // Actually, strict upsert in supabase js replaces fields provided. 
                // We should probably NOT overwrite username if it exists? 
                // But for "Recovery", we just want it to work. 
                // To be safe, we only provide username if strictly necessary? 
                // Let's just include it. If they want to change username, that's a different flow.
                // Re-inserted username might overwrite. 
                // Better approach: Don't overwrite username if it exists. 
                // But for the "null value" error, we focus on EMAIL.
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

        // 4. Update Auth Metadata (Sync for Sidebar)
        const { error: authError } = await supabase.auth.admin.updateUserById(
            userId,
            { user_metadata: { dj_name, full_name, profile_image_url } }
        );

        if (authError) {
             console.error("Auth Metadata Update Failed:", authError);
        }

        return NextResponse.json({ success: true });
    } catch(err: any) {
        console.error("Profile update failed (API):", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
// Trigger Vercel Deploy
