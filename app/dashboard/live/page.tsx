import { supabase } from "@/lib/supabase"
import { LiveDashboard } from "@/components/dashboard/live/live-dashboard"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default async function LivePage() {
  // 1. Find the active event (status = ''live'' or just most recent created)
  // For MVP since we don''t have a strict "Go Live" toggle yet, let''s take the most recent created event 
  // that isn''t ''ended''. (Or we can assume the user clicked "Manage Live" from dashboard which could pass ID?)
  // But this is a page route. Let''s fetch the most recent event for now.
  
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

  // 2. Fetch initial requests
  const { data: requests } = await supabase
    .from("requests")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })

  // 3. Calculate initial revenue
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
