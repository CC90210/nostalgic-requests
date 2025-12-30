import { notFound } from "next/navigation"
import { RequestFlow } from "@/components/portal/request-flow"
import { MapPin } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error("Missing Supabase configuration");
  }
  
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export default async function EventPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  if (!slug) {
    return notFound();
  }

  let event = null;
  
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("unique_slug", slug)
      .single();

    if (error || !data) {
      console.error("Event not found:", error);
      return notFound();
    }
    
    event = data;
  } catch (error) {
    console.error("Failed to fetch event:", error);
    return notFound();
  }

  if (event.status === "ended") {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Event Ended</h1>
        <p className="text-gray-400">Song requests for this event are now closed.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pb-safe">
      {/* Header */}
      <div className="bg-[#1A1A1B] border-b border-[#2D2D2D] p-6 text-center space-y-2 sticky top-0 z-10 backdrop-blur-md">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">
          {event.name}
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <MapPin className="h-3 w-3" /> {event.venue_name}
        </div>
        {event.custom_message && (
          <p className="text-sm italic text-gray-500 mt-2">"{event.custom_message}"</p>
        )}
      </div>

      {/* Main Content - Song Request Flow */}
      <div className="p-4">
        <RequestFlow 
          eventId={event.id} 
          eventSlug={event.unique_slug} 
          basePrice={event.base_price}
        />
      </div>
    </div>
  );
}

