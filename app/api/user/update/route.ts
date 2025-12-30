import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

        const { error } = await supabase.from("dj_profiles")
            .update({
                dj_name,
                full_name,
                phone,
                bio,
                profile_image_url,
                updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);

        if (error) {
            console.error("Profile update failed (DB):", error);
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch(err: any) {
        console.error("Profile update failed (API):", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
