import { notFound } from "next/navigation";
import { RequestFlow } from "@/components/portal/request-flow";
import { MapPin } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Force dynamic - we need fresh data every request
export const dynamic = "force-dynamic";

export default async function EventPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  console.log("[EventPortal] Loading slug:", slug);

  if (!slug) {
    console.error("[EventPortal] No slug provided");
    return notFound();
  }

  // Use Service Role to BYPASS RLS explicitly
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("[EventPortal] Missing Env Vars! URL:", !!supabaseUrl, "Key:", !!serviceKey);
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-500">Configuration Error</h1>
          <p>Server environment missing credentials.</p>
        </div>
      </div>
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("unique_slug", slug)
    .single();

  if (error) {
    console.error("[EventPortal] DB Error:", error);
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-500">Error Loading Event</h1>
          <p className="text-gray-400">Database connection failed: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!event) {
    console.error("[EventPortal] Event not found for slug:", slug);
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-yellow-500">Event Not Found</h1>
          <p className="text-gray-400">We couldn''t find an event with this link.</p>
          <code className="bg-gray-800 p-2 rounded text-xs">{slug}</code>
        </div>
      </div>
    );
  }

  if (event.status === "ended") {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-4 text-center text-white">
        <h1 className="text-3xl font-bold mb-2">Event Ended</h1>
        <p className="text-gray-400">Song requests for this event are now closed.</p>
      </div>
    );
  }

  console.log("[EventPortal] Success! Rendering event:", event.name);

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

      {/* Main Content */}
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
