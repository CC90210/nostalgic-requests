# Deployment Checklist - Critical Fixes

## 1. Database Security (URGENT)
You **MUST** run the SQL migration file located at:
`supabase/migrations/20241230_fix_events_rls_strict.sql`

This applies the Row Level Security that prevents DJ A from seeing DJ B's events.
Without this SQL script running, the application is **INSECURE**.

## 2. Frontend Updates
The following updates have been applied to the codebase:
- **Hard Logout**: Signing out now clears all browser data and forces a reload.
- **Strict Fetching**: The Dashboard now uses strict, user-scoped data fetching.
- **Admin Privacy**: The Admin (konamak@icloud.com) no longer has "View All" permission in the UI, ensuring a clean dashboard.
- **Stripe Bypass**: The Admin still retains the ability to receive direct payouts and "Go Live" without Onboarding.

## 3. Verification Steps
1. Log in as `konamak@icloud.com`.
2. Verify you DO NOT see any events from other DJs (clean dashboard).
3. Create a test event.
4. Verify "Go Live" is unlocked.
5. Verify "Connect Stripe" button is hidden/replaced by "Platform Owner" badge in Settings.
