# Domain Update Checklist for Nostalgic Requests

Great job securing **nostalgicrequests.com**! I have updated the codebase to reflect this change (SEO, Metadata, Branding, Fallback URLs).

however, you MUST update your external services manually to ensure everything works 100%.

## 1. Vercel Configuration
1.  Go to your Vercel Dashboard > Project > **Settings** > **Domains**.
2.  Add `nostalgicrequests.com` and `www.nostalgicrequests.com`.
3.  Follow Vercel's instructions to update your DNS (A Record / CNAME) at your domain registrar.
4.  Go to **Settings** > **Environment Variables**.
5.  Find `NEXT_PUBLIC_APP_URL`.
6.  Update its value to `https://nostalgicrequests.com`.
7.  **Redeploy** your project for changes to take effect.

## 2. Supabase Authentication (Critical)
1.  Go to your Supabase Dashboard > Authentication > **URL Configuration**.
2.  **Site URL**: Change this to `https://nostalgicrequests.com`.
3.  **Redirect URLs**: Add the following:
    *   `https://nostalgicrequests.com/**`
    *   `https://nostalgicrequests.com/auth/callback`
    *   `https://nostalgicrequests.com/dashboard`
4.  If you don't do this, users won't be able to log in!

## 3. Stripe Configuration
1.  **Apple Pay / Google Pay**: Go to Stripe Dashboard > Settings > Payments > **Payment Methods** > Apple Pay.
2.  Add `nostalgicrequests.com` to the "Web domains" list. You may need to download a verification file and upload it to your `public/.well-known` folder if Stripe requires it (standard Next.js `public` folder works).
3.  **Connect Onboarding**: If you hardcoded any return URLs in Stripe dashboard settings (unlikely if using API), update them. Our code uses `NEXT_PUBLIC_APP_URL`, so updating the Env Var in step 1 is key.

## 4. Google Search Console & Analytics
1.  Once your domain is live, verify it on [Google Search Console](https://search.google.com/search-console).
2.  Submit your sitemap: `https://nostalgicrequests.com/sitemap.xml`.
