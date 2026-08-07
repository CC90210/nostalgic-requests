import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminData as supabase } from "@/lib/supabase-admin";
import { r2Configured } from "@/lib/r2-storage";

// Init Supabase with Service Role Key (Admin Access)

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;

        if (!file || !userId) {
            return NextResponse.json({ error: "Missing file or userId" }, { status: 400 });
        }

        // 1. Ensure "avatars" bucket exists.
        // Supabase-only ceremony: on R2 the bucket is provisioned once, out of
        // band, and the adapter refuses listBuckets rather than returning an
        // empty list that would read as "no buckets exist" and trigger a
        // pointless create attempt on every upload.
        if (!r2Configured()) {
            const { data: buckets } = await supabase.storage.listBuckets();
            const avatarBucket = buckets?.find(b => b.name === "avatars");

            if (!avatarBucket) {
                const { error: createError } = await supabase.storage.createBucket("avatars", {
                    public: true,
                    fileSizeLimit: 5242880, // 5MB
                    allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"]
                });
                if (createError) {
                    console.error("Bucket creation failed:", createError);
                }
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
