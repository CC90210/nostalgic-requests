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

        // 1. Upsert Profile Row (DB)
        const { error: dbError } = await supabase.from("dj_profiles")
            .upsert({
                user_id: userId,
                dj_name,
                full_name,
                phone,
                bio,
                profile_image_url,
                updated_at: new Date().toISOString()
            }, { onConflict: "user_id" });

        if (dbError) {
            console.error("Profile DB Upsert Failed:", dbError);
            throw dbError;
        }

        // 2. Update Auth Metadata (Sync for Session/Sidebar to reflect immediately without refresh)
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
