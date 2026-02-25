const fs = require('fs');

let file = fs.readFileSync('./app/dashboard/events/[id]/page.tsx', 'utf8');
file = file.replace('import { useAuth } from \"@/lib/auth-context\";', 'import { useAuth } from \"@/lib/auth-context\";\\nimport { isPlatformOwner } from \"@/lib/platform\";');
file = file.replace('const isPlatformOwner = user?.email?.toLowerCase() === \"konamak@icloud.com\";', 'const isPlatformOwnerCheck = isPlatformOwner(user?.email);');
file = file.replace('const hasPayouts = !!profile?.stripe_onboarding_complete || isPlatformOwner;', 'const hasPayouts = !!profile?.stripe_onboarding_complete || isPlatformOwnerCheck;');
fs.writeFileSync('./app/dashboard/events/[id]/page.tsx', file);

let file2 = fs.readFileSync('./app/dashboard/settings/page.tsx', 'utf8');
file2 = file2.replace('import { useAuth } from \"@/lib/auth-context\";', 'import { useAuth } from \"@/lib/auth-context\";\\nimport { isPlatformOwner } from \"@/lib/platform\";');
file2 = file2.replace('const isPlatformOwner = user.email?.toLowerCase() === \"konamak@icloud.com\";', 'const isPlatformOwnerCheck = isPlatformOwner(user?.email);');
file2 = file2.replace('const isStripeConnected = profile?.stripe_onboarding_complete || isPlatformOwner;', 'const isStripeConnected = profile?.stripe_onboarding_complete || isPlatformOwnerCheck;');
file2 = file2.replace('{isPlatformOwner ? <Crown', '{isPlatformOwnerCheck ? <Crown');
file2 = file2.replace('{isPlatformOwner ? \"Platform Owner\"', '{isPlatformOwnerCheck ? \"Platform Owner\"');
file2 = file2.replace('? (isPlatformOwner ? \"You are the platform', '? (isPlatformOwnerCheck ? \"You are the platform');
file2 = file2.replace('{isPlatformOwner ? (', '{isPlatformOwnerCheck ? (');
fs.writeFileSync('./app/dashboard/settings/page.tsx', file2);

let file3 = fs.readFileSync('./emails/WelcomeEmail.tsx', 'utf8');
file3 = file3.replace('Hey <strong>{djName}</strong>! ??', 'Hey <strong>{djName}</strong>! ');
file3 = file3.replace(\We''re\, \We're\);
file3 = file3.replace(\doesn''t\, \doesn't\);
fs.writeFileSync('./emails/WelcomeEmail.tsx', file3);

