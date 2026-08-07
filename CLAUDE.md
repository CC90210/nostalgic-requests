# NOSTALGIC REQUESTS — Live Event Song Request System

> Dark-theme paid song request platform for DJs and live event performers.
> Part of the Business-Empire-Agent ecosystem — managed by Bravo.

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5
- **Database:** Supabase (PostgreSQL + Realtime) — project `jqybbrtzpvmefgzzdagz`
- **Payments:** Stripe + Stripe Connect (platform model — DJ onboards as connected account)
- **Music Search:** iTunes Search API (via `lib/itunes.ts`)
- **Email:** Resend (`lib/resend.ts`) + `@react-email/components`
- **SMS:** Twilio (`lib/twilio.ts`) — lead capture / marketing
- **Styling:** Tailwind CSS 3 + shadcn/ui (Radix primitives) + Framer Motion
- **Auth:** Supabase Auth via `@supabase/ssr` (cookie-based, Edge middleware)
- **Deploy:** Vercel

## Architecture

```
app/
  (auth)/           # Auth group — login page
  api/              # API routes
    auth/           # Supabase auth callbacks
    events/         # Event CRUD
    music/          # iTunes search proxy
    requests/       # Song request submission
    stripe/
      checkout/     # Payment intent creation
      connect/      # DJ Stripe Connect onboarding
      webhook/      # Stripe webhook handler
    user/           # User profile ops
  auth/             # Supabase OAuth callback handler
  dashboard/        # Protected DJ dashboard
    events/         # Per-event management
    leads/          # Lead (phone number) collection view
    live/           # Real-time request queue for live events
    new/            # Create new event
    settings/       # DJ account + Stripe Connect settings
  e/[slug]/         # Public event portal — audience-facing request page
  signup/           # DJ registration
  privacy/          # Legal
  terms/
  support/

lib/
  supabase.ts       # Singleton client (anon) + admin (service role) + mock for build-time
  stripe.ts         # Singleton Stripe client
  pricing.ts        # Pricing config, package/addon calculation helpers
  itunes.ts         # iTunes Search API wrapper
  platform.ts       # Platform-level helpers
  rate-limit.ts     # Rate limiting utilities
  resend.ts         # Email client
  twilio.ts         # SMS client
  utils.ts          # cn() and general helpers

components/
  dashboard/        # Dashboard-specific components
  landing/          # Marketing/landing page components
  portal/           # Audience-facing request portal components
  ui/               # shadcn/ui primitives

supabase/
  migrations/       # SQL migration files — apply via Supabase CLI
```

## Business Model

DJ signs up, connects Stripe account, creates an event. Audience scans QR code, lands on `/e/[slug]`, searches for a song via iTunes, pays Stripe, request appears in DJ's live dashboard in real time. Platform takes a cut via Stripe Connect.

**Pricing (defaults in `lib/pricing.ts` — DJ can customize):**

| Package | Price | Songs |
|---------|-------|-------|
| Single | $5 | 1 |
| Double Up | $8 | 2 |
| Party Pack | $12 | 3 |

**Add-ons:** Priority Play +$10, Shoutout +$5, Guaranteed Next +$20

## Key Patterns

**Database access (post-Turso):** Server code uses `adminData` (or `getAdminData()`) from `lib/supabase-admin.ts` — it honours `EMPIRE_DATA_BACKEND` and routes to Turso or Supabase accordingly. Prefer the `adminData` lazy handle at module scope; a direct `getAdminData()` call at import time runs during `next build` and fails the build. Pages and routes that act on behalf of a signed-in DJ use `resolveUser()` / `requireUser()` from `lib/require-user.ts`, which returns both the session and the right client.

Do **not** use `getSupabase()` / `getSupabaseAdmin()` from `lib/supabase.ts`. They bypass the Turso switch, and `getSupabase()` returns a stand-in client when env vars are absent.

**The browser gets no database credential.** Turso has no RLS, so every query needs an explicit ownership filter and must run server-side. `events` filters on `user_id`; `requests` and anything under an event derive ownership through `ownedEvent()`; `leads` filters on `user_id`. A browser-side `.eq("id", …)` with no owner check used to be safe because RLS was underneath it — it no longer is.

**Money columns are TEXT.** `numeric` maps to `TEXT` so money never becomes a float. `amount_paid`, `total_spent` and the `price_*` columns must be wrapped in `Number(...)` before any arithmetic, or `+` concatenates and the later `.toFixed(2)` throws.

**Stripe:** Always use `getStripe()` from `lib/stripe.ts`. Never call `new Stripe()` directly.

**Auth guard:** Middleware at `middleware.ts` protects `/dashboard` and `/my-events`. Any new protected routes must be added to the `isProtected` check there.

**Pricing changes:** All pricing logic lives in `lib/pricing.ts`. Never hardcode dollar amounts in components — always reference `DEFAULT_PRICING` or a DJ's custom config from the DB.

**Build safety:** `next.config.ts` has `ignoreBuildErrors: true` as a deployment rescue hatch — remove this debt when types are clean. Never rely on it as an excuse to leave type errors in new code.

**RLS:** Row-level security is enforced. See `supabase/migrations/` for policy definitions. Never bypass RLS in new code. Use `getSupabaseAdmin()` only when a service-role bypass is explicitly required (e.g., webhook handlers).

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_CONNECT_CLIENT_ID
NEXT_PUBLIC_APP_URL
RESEND_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
```

Never hardcode any of these. Never commit `.env.local`.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build — must pass with zero errors
npm run start    # Start production server
npm run lint     # ESLint check
```

## Database

Supabase project: `jqybbrtzpvmefgzzdagz`

Migrations are in `supabase/migrations/`. Apply via Supabase CLI:
```bash
supabase db push
```

Key tables (inferred from migrations and API routes): `events`, `requests`, `dj_profiles`, `leads`.

## Development Rules

1. **TypeScript strict mode** — no `any` unless unavoidable with a comment explaining why.
2. **No `console.log` in production code** — use proper error handling and return meaningful error responses.
3. **No hardcoded secrets or URLs** — all config from environment variables.
4. **RLS must be respected** — never disable or bypass without explicit service-role justification.
5. **Pricing changes go in `lib/pricing.ts`** — never in components.
6. **New protected routes** must be added to the `isProtected` check in `middleware.ts`.
7. **Run `npm run build` before shipping** — zero errors required.

## Known Technical Debt (from ROADMAP.md)

- `ignoreBuildErrors: true` in `next.config.ts` — clean up when types are resolved
- `no-explicit-any` lint warnings throughout — resolve incrementally
- No Playwright E2E tests for the core "Scan → Request → Pay" flow
- Rate limiting on `api/requests` endpoints not yet implemented (`lib/rate-limit.ts` exists but check coverage)

## Part of Business-Empire-Agent

This app is managed by Bravo (Claude Code agent at `C:\Users\User\Business-Empire-Agent`).

When working here:
- Make ALL code changes in THIS repo (`C:\Users\User\APPS\nostalgic-requests`)
- Commit and push from THIS repo, not from Business-Empire-Agent
- After completing work, log a 1-2 sentence summary to `C:\Users\User\Business-Empire-Agent\memory\SESSION_LOG.md`
- Reference: `brain/APP_REGISTRY.md` entry — Nostalgic Requests / `jqybbrtzpvmefgzzdagz`
