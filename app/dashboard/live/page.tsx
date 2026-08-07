import { redirect } from 'next/navigation';
import { LiveDashboard } from "@/components/dashboard/live/live-dashboard"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { resolveUser } from "@/lib/require-user";

export const dynamic = 'force-dynamic';

export default async function LivePage() {
  // Previously this ran getSupabase() — which silently returns a MOCK client
  // when the Supabase env vars are absent — and selected the newest non-ended
  // event with NO user filter at all. RLS was the only thing keeping one DJ off
  // another DJ's live event; without it that query hands over whichever event
  // was created most recently on the whole platform.
  const ctx = await resolveUser();
  if (!ctx) redirect('/login');

  const { data: event } = await ctx.db
    .from("events")
    .select("*")
    .eq("user_id", ctx.user.id)
    .neq("status", "ended")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!event) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <h2 className="text-2xl font-bold">No Live Event Found</h2>
            <p className="text-muted-foreground">Create an event to start accepting requests.</p>
            <Button asChild>
                <Link href="/dashboard/new">Create Event <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </div>
    )
  }

  // 2. Fetch initial requests (Strictly PAID only)
  const { data: requests } = await ctx.db
    .from("requests")
    .select("*")
    .eq("event_id", event.id)
    .eq("is_paid", true)
    .order("created_at", { ascending: false })

  // 3. Initial revenue. amount_paid is TEXT — numeric maps to TEXT so money
  // never becomes a float — so `sum + r.amount_paid` CONCATENATES and the
  // result explodes later at .toFixed(). Coerce here.
  const initialRevenue = (requests ?? []).reduce(
    (sum: number, req: any) => sum + Number(req.amount_paid || 0), 0)

  return (
    <LiveDashboard
        eventId={event.id}
        eventName={event.name}
        venueName={event.venue_name}
        initialRequests={requests || []}
        initialRevenue={initialRevenue}
        endTime={event.end_time}
    />
  )
}
