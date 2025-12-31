# Nostalgic Requests - Production Roadmap & Next Steps

This document outlines the recommended next steps to elevate Nostalgic Requests to a fully polished, enterprise-grade platform.

## 1. Immediate Post-Launch Optimization

### Analytics & Monitoring
*   **Vercel Analytics**: Enable "Audiences" and "Speed Insights" on the Vercel dashboard to track real user performance and demographics.
*   **Error Logging**: Integrate **Sentry** or **LogRocket** to capture client-side errors that users might encounter in the wild.

### Security
*   **Rate Limiting**: Implement `upstash/ratelimit` on `api/requests` endpoints to prevent spam requests at live events.
*   **Input Sanitization**: Ensure all user inputs (song titles, names) are sanitized to prevent XSS (Next.js handles most, but be vigilant).

### Performance
*   **Image Optimization**: The Landing Page assets are optimized, but ensure user-uploaded avatars are resized/compressed server-side or using Cloudinary/Uploadcare for better performance.
*   **Database**: Add indexes to `requests` table on `event_id` and `status` for faster querying as data grows.

## 2. Recommended Features (Phase 2)

### For Performers (DJs/Bands)
*   **"Tips Only" Mode**: Allow generic tipping without a specific song request.
*   **Songbook Upload**: Allow DJs to upload a CSV/PDF of their repertoire so users can search *their* library instead of just Spotify/Apple Music.
*   **Offline Mode**: A PWA (Progressive Web App) manifest to allow the dashboard to work offline (or handle patchy venue Wi-Fi better).

### For Audience
*   **Recent Requests Feed**: Show a public list of what others have requested (gamification).
*   **Upvoting**: Allow users to "upvote" pending requests to bump them up the queue (potential revenue stream?).

## 3. Technical Debt Cleanup
*   **Linting**: Run `npm run lint` and resolve all `no-explicit-any` warning to ensure strict type safety.
*   **Testing**: Add Playwright E2E tests for the critical "Scan -> Request -> Pay" flow.
*   **Email Sync**: Verify `Resend` integration is active and welcome emails are firing correctly on signup.

## 4. UI/UX Polish
*   **Skeleton Loading**: Replace spinner loaders with Skeleton screens for a smoother perceived load time.
*   **Dark Mode Toggle**: Currently forced Dark Mode (which is on brand), but ensure `system` preference is respected if ever enabled.
