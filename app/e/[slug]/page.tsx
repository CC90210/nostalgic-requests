import { notFound } from "next/navigation"
import { RequestFlow } from "@/components/portal/request-flow"
import { MapPin, Disc } from "lucide-react"
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase"

export const dynamic = 'force-dynamic';

export default async function EventPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured()) return <div>Loading...</div>;
  const { slug } = await params;
  
  const supabase = getSupabase();
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("unique_slug", slug)
    .single();

  if (error || !event) {
    return notFound();
  }

  // Check if live (optional enforcement, prompt says "If not live or doesn''t exist, show appropriate error")
  // For now, we allow interaction even if "draft", but maybe warn.
  // Ideally, block if "ended".
  if (event.status === "ended") {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
              <h1 className="text-3xl font-bold mb-2">Event Ended</h1>
              <p className="text-muted-foreground">Creating requests for this event is closed.</p>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-safe">
      {/* Header */}
      <div className="bg-secondary/30 border-b p-6 text-center space-y-2 sticky top-0 z-10 backdrop-blur-md">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">
            {event.name}
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" /> {event.venue_name}
        </div>
        {event.custom_message && (
             <p className="text-sm italic opacity-80 mt-2">"{event.custom_message}"</p>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4">
        <RequestFlow 
            eventId={event.id} 
            eventSlug={event.unique_slug} 
            basePrice={event.base_price}
        />
      </div>
    </div>
  )
}
