# ?? Nostalgic Requests

A premium song request and payment platform for DJs. Accept paid song requests at live events via QR code, process payments with Apple Pay, and manage requests in real-time.

## Features

- **Event Management** - Create events with auto-generated QR codes
- **Music Search** - Search millions of songs via iTunes API
- **Payments** - Stripe integration with Apple Pay & Google Pay
- **Real-Time Dashboard** - See requests instantly as they come in
- **Smart Queue** - Priority sorting for premium requests
- **Lead Collection** - Capture customer phone numbers for marketing

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL + Realtime)
- **Payments:** Stripe
- **Music API:** iTunes Search API
- **Styling:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion

## Pricing Tiers

| Package | Price | Songs |
|---------|-------|-------|
| Single | $5 | 1 |
| Double Up | $8 | 2 |
| Party Pack | $12 | 3 |

**Add-ons:**
- Priority Play: +$10
- Shoutout: +$5
- Guaranteed Next: +$20

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your keys
3. Run `npm install`
4. Run `npm run dev`
5. Set up Supabase tables
6. Deploy to Vercel

## Environment Variables

See `.env.example` for required variables.

## License

Private - All rights reserved.

---

Built by [Nostalgic Events](https://nostalgicevents.com)
