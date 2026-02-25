const fs = require('fs');
const path = require('path');
const file = path.resolve('app/api/stripe/checkout/route.ts');
let content = fs.readFileSync(file, 'utf8');

// 1. imports
content = content.replace(
  /import \{ z \} from "zod";/,
  \import { z } from "zod";\nimport { rateLimit } from "@/lib/rate-limit";\nimport { isPlatformOwner } from "@/lib/platform";\
);

// 2. rate limit
content = content.replace(
  /export async function POST\(request: NextRequest\) \{\r?\n\s+try \{\r?\n\s+const body = await request\.json\(\);/,
  \export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = rateLimit(\\\checkout_\\\\, 5, 60000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const body = await request.json();\
);

// 3. platform owner check
content = content.replace(
  /if \(djEmail\.toLowerCase\(\)\.trim\(\) === "konamak@icloud\.com"\) \{/,
  \if (isPlatformOwner(djEmail)) {\
);

// 4. stripe edge case
// We look for:
// if (profile?.stripe_account_id && profile?.stripe_onboarding_complete) {
//   destinationAccount = profile.stripe_account_id;
// }
const stripeRegex = /if \(profile\?\.stripe_account_id && profile\?\.stripe_onboarding_complete\) \{\r?\n\s+destinationAccount = profile\.stripe_account_id;\r?\n\s+\}/;

const newStripe = \if (profile?.stripe_account_id && profile?.stripe_onboarding_complete) {
          destinationAccount = profile.stripe_account_id;
        } else {
          return NextResponse.json(
            { error: "This DJ hasn't set up payments yet. Please ask them to complete setup." },
            { status: 400 }
          );
        }\;

content = content.replace(stripeRegex, newStripe);
fs.writeFileSync(file, content);
console.log('done2');
