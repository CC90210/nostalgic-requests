import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Init Supabase with Service Role Key (Admin Access)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;

        if (!file || !userId) {
            return NextResponse.json({ error: "Missing file or userId" }, { status: 400 });
        }

        // 1. Ensure "avatars" bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const avatarBucket = buckets?.find(b => b.name === "avatars");
        
        if (!avatarBucket) {
            // Try to create the bucket if it doesn't exist
            const { error: createError } = await supabase.storage.createBucket("avatars", {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"]
            });
            
            if (createError) {
                console.error("Bucket creation failed:", createError);
            }
        }

        // 2. Prepare File
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3. Upload File via Service Role (Bypasses RLS)
        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            throw new Error(`Storage Error: ${uploadError.message}`);
        }

        // 4. Generate Public URL
        const { data: { publicUrl } } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);

        return NextResponse.json({ success: true, url: publicUrl });

    } catch (err: any) {
        console.error("Server Upload Error:", err);
        return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
    }
}
