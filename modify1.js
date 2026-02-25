const fs = require('fs');
const path = require('path');
const file = path.resolve('app/api/stripe/checkout/route.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace('import { z } from "zod";', 'import { z } from "zod";\nimport { rateLimit } from "@/lib/rate-limit";\nimport { isPlatformOwner } from "@/lib/platform";');

content = content.replace(
  'export async function POST(request: NextRequest) {\n  try {\n    const body = await request.json();',
  'export async function POST(request: NextRequest) {\n  try {\n    const ip = request.headers.get("x-forwarded-for") || "unknown";\n    const { allowed } = rateLimit(checkout_, 5, 60000);\n    if (!allowed) {\n      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });\n    }\n\n    const body = await request.json();'
);

content = content.replace(
  'if (djEmail.toLowerCase().trim() === "konamak@icloud.com") {',
  'if (isPlatformOwner(djEmail)) {'
);

const check =       // B. STRIPE PROFILE CHECK (If not owner)
      if (!isPlatformOwner) {
        const { data: profile } = await supabase
          .from("dj_profiles")
          .select("stripe_account_id, stripe_onboarding_complete")
          .eq("user_id", eventData.user_id)
          .single();

        if (profile?.stripe_account_id && profile?.stripe_onboarding_complete) {
          destinationAccount = profile.stripe_account_id;
        };

const newCheck =       // B. STRIPE PROFILE CHECK (If not owner)
      if (!isPlatformOwner) {
        const { data: profile } = await supabase
          .from("dj_profiles")
          .select("stripe_account_id, stripe_onboarding_complete")
          .eq("user_id", eventData.user_id)
          .single();

        if (profile?.stripe_account_id && profile?.stripe_onboarding_complete) {
          destinationAccount = profile.stripe_account_id;
        } else {
          return NextResponse.json(
            { error: "This DJ hasn't set up payments yet. Please ask them to complete setup." },
            { status: 400 }
          );
        };

content = content.replace(check, newCheck);
fs.writeFileSync(file, content);
console.log('done1');
