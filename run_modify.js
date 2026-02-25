const fs = require('fs');
const file = 'app/api/stripe/checkout/route.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  'import { z } from "zod";',
  'import { z } from "zod";\nimport { rateLimit } from "@/lib/rate-limit";\nimport { isPlatformOwner } from "@/lib/platform";'
);

const toFindPost = 'export async function POST(request: NextRequest) {\n  try {\n    const body = await request.json();';
const toFindPostWindows = 'export async function POST(request: NextRequest) {\r\n  try {\r\n    const body = await request.json();';
const toReplacePost = 'export async function POST(request: NextRequest) {\n  try {\n    const ip = request.headers.get("x-forwarded-for") || "unknown";\n    const { allowed } = rateLimit(checkout_, 5, 60000);\n    if (!allowed) {\n      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });\n    }\n\n    const body = await request.json();';

c = c.replace(toFindPost, toReplacePost);
c = c.replace(toFindPostWindows, toReplacePost);

c = c.replace(
  'if (djEmail.toLowerCase().trim() === "konamak@icloud.com") {',
  'if (isPlatformOwner(djEmail)) {'
);

const toFindStripe = '        if (profile?.stripe_account_id && profile?.stripe_onboarding_complete) {\n          destinationAccount = profile.stripe_account_id;\n        }\n      }';
const toFindStripeWindows = '        if (profile?.stripe_account_id && profile?.stripe_onboarding_complete) {\r\n          destinationAccount = profile.stripe_account_id;\r\n        }\r\n      }';
const toReplaceStripe = '        if (profile?.stripe_account_id && profile?.stripe_onboarding_complete) {\n          destinationAccount = profile.stripe_account_id;\n        } else {\n          return NextResponse.json(\n            { error: "This DJ hasn\\'t set up payments yet. Please ask them to complete setup." },\n            { status: 400 }\n          );\n        }\n      }';

c = c.replace(toFindStripe, toReplaceStripe);
c = c.replace(toFindStripeWindows, toReplaceStripe);

fs.writeFileSync(file, c);
console.log('Done modify');
