import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { LiveDashboard } from "@/components/dashboard/live/live-dashboard"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const dynamic = 'force-dynamic';

export default async function LivePage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Live Dashboard</h1>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const supabase = getSupabase();

  // Find the currently live event (or most recent created)
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .neq("status", "ended")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

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
  const { data: requests } = await supabase
    .from("requests")
    .select("*")
    .eq("event_id", event.id)
    .eq("is_paid", true)
    .order("created_at", { ascending: false })

  // 3. Calculate initial revenue (Strictly PAID only)
  const initialRevenue = requests?.reduce((sum, req) => sum + (req.amount_paid || 0), 0) || 0

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
