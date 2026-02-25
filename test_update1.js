const fs = require('fs');

let file = fs.readFileSync('./app/api/stripe/checkout/route.ts', 'utf8');
file = file.replace('import { z } from "zod";', 'import { z } from "zod";\nimport { rateLimit } from "@/lib/rate-limit";\nimport { isPlatformOwner } from "@/lib/platform";');

file = file.replace('export async function POST(request: NextRequest) {\n  try {\n    const body = await request.json();', 'export async function POST(request: NextRequest) {\n  try {\n    const ip = request.headers.get("x-forwarded-for") || "unknown";\n    const { allowed } = rateLimit("checkout_" + ip, 5, 60000);\n    if (!allowed) {\n      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });\n    }\n\n    const body = await request.json();');

file = file.replace('let isPlatformOwner = false;', 'let isPlatformOwnerCheck = false;');

file = file.replace(\      if (userData?.user?.email) {
        djEmail = userData.user.email;
        // CHECK PLATFORM OWNER BY EMAIL
        if (djEmail.toLowerCase().trim() === "konamak@icloud.com") {
          isPlatformOwner = true;
          destinationAccount = "PLATFORM_OWNER"; // Valid Bypass
        }
      }

      // B. STRIPE PROFILE CHECK (If not owner)
      if (!isPlatformOwner) {
        const { data: profile } = await supabase
          .from("dj_profiles")
          .select("stripe_account_id, stripe_onboarding_complete")
          .eq("user_id", eventData.user_id)
          .single();

        if (profile?.stripe_account_id && profile?.stripe_onboarding_complete) {
          destinationAccount = profile.stripe_account_id;
        }
      }\, \      if (userData?.user?.email) {
        djEmail = userData.user.email;
        // CHECK PLATFORM OWNER BY EMAIL
        if (isPlatformOwner(djEmail)) {
          isPlatformOwnerCheck = true;
          destinationAccount = "PLATFORM_OWNER"; // Valid Bypass
        }
      }

      // B. STRIPE PROFILE CHECK (If not owner)
      if (!isPlatformOwnerCheck) {
        const { data: profile } = await supabase
          .from("dj_profiles")
          .select("stripe_account_id, stripe_onboarding_complete")
          .eq("user_id", eventData.user_id)
          .single();

        if (profile?.stripe_account_id && profile?.stripe_onboarding_complete) {
          destinationAccount = profile.stripe_account_id;
        } else {
          return NextResponse.json({ error: "This DJ hasn't set up payments yet. Please ask them to complete setup." }, { status: 400 });
        }
      }\);

file = file.replace(\    // TRANSFER LOGIC
    if (!isPlatformOwner) {\, \    // TRANSFER LOGIC
    if (!isPlatformOwnerCheck && destinationAccount !== "PLATFORM_OWNER") {\);

fs.writeFileSync('./app/api/stripe/checkout/route.ts', file);
