import { EventCard } from "@/components/dashboard/event-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

async function getEvents() {
  // Use absolute URL for server-side fetch
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${url}/api/events`, {
        cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error("Failed to fetch events", e);
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Events</h2>
            <p className="text-muted-foreground">
            Manage your past and upcoming events.
            </p>
        </div>
        <Button asChild>
            <Link href="/dashboard/new">
                <Plus className="mr-2 h-4 w-4" /> Create Event
            </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event: any) => (
          <EventCard key={event.id} event={event} />
        ))}
        {events.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
                No events found. Create your first one!
            </div>
        )}
      </div>
    </div>
  )
}
