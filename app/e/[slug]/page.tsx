import { createClient } from "@supabase/supabase-js";
import { RequestFlow } from "@/components/portal/request-flow";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EventPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  if (!slug) return notFound();

  console.log("[Portal] Init for slug:", slug);

  // Validate Env Vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return (
          <div className="h-screen flex items-center justify-center bg-black text-white p-8 border-4 border-red-500">
            <div>
                <h1 className="text-3xl font-bold mb-4">Configuration Error</h1>
                <p>Missing Service Role Key or URL.</p>
            </div>
          </div>
      );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  console.log("[Portal] Client created. Fetching...");

  try {
    // 5 Second Timeout Race
    const fetchPromise = supabase
      .from("events")
      .select("*") // Explicitly select all
      .eq("unique_slug", slug)
      .single();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database Request Timed Out (5s)")), 5000)
    );

    const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
    const { data: event, error } = result;

    if (error) {
      console.error("[Portal] DB Error:", error);
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-black text-white p-8">
            <h1 className="text-3xl text-red-500 font-bold mb-4">Database Error</h1>
            <p className="mb-4">{error.message}</p>
            <pre className="text-xs bg-gray-900 p-2">{JSON.stringify(error, null, 2)}</pre>
        </div>
      );
    }

    if (!event) {
      console.error("[Portal] Not Found");
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-black text-white p-8">
            <h1 className="text-3xl text-yellow-500 font-bold mb-4">Event Not Found</h1>
            <p>Slug: {slug}</p>
        </div>
      );
    }

    console.log("[Portal] Event found:", event.name);

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white">
            {/* Header */}
            <div className="p-6 text-center border-b border-white/10">
                <h1 className="text-2xl font-bold">{event.name}</h1>
                <p className="text-gray-400">{event.venue_name}</p>
            </div>

            {/* Client Component */}
            <div className="p-4">
                 <RequestFlow 
                    eventId={event.id}
                    eventSlug={event.unique_slug}
                    basePrice={event.base_price}
                 />
            </div>
        </div>
    );

  } catch (err: any) {
      console.error("[Portal] Exception:", err);
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-black text-white p-8 border-4 border-purple-500">
              <h1 className="text-3xl text-purple-500 font-bold mb-4">System Exception</h1>
              <p className="mb-4 text-xl">{err.message || "Unknown Error"}</p>
              <p className="text-gray-500">Time: {new Date().toISOString()}</p>
          </div>
      );
  }
}
