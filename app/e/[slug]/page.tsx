import { createClient } from "@supabase/supabase-js";
import { RequestFlow } from "@/components/portal/request-flow";
import { notFound } from "next/navigation";
import { DEFAULT_PRICING } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function EventPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  if (!slug) return notFound();

  console.log("[Portal] Init for slug:", slug);

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

  try {
    const fetchPromise = supabase.from("events").select("*").eq("unique_slug", slug).single();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Database Request Timed Out")), 5000));
    const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
    const { data: event, error } = result;

    if (error || !event) {
       console.error("[Portal] Error or Not Found:", error);
       return notFound();
    }

    // Dynamic Pricing Config with Defaults
    const pricingConfig = {
        price_single: Number(event.price_single) || DEFAULT_PRICING.price_single,
        price_double: Number(event.price_double) || DEFAULT_PRICING.price_double,
        price_party: Number(event.price_party) || DEFAULT_PRICING.price_party,
        price_priority: Number(event.price_priority) || DEFAULT_PRICING.price_priority,
        price_shoutout: Number(event.price_shoutout) || DEFAULT_PRICING.price_shoutout,
        price_guaranteed: Number(event.price_guaranteed) || DEFAULT_PRICING.price_guaranteed,
    };

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white">
            <div className="p-6 text-center border-b border-white/10">
                <h1 className="text-2xl font-bold">{event.name}</h1>
                <p className="text-gray-400">{event.venue_name}</p>
            </div>
            <div className="p-4">
                 <RequestFlow 
                    eventId={event.id}
                    eventSlug={event.unique_slug}
                    pricingConfig={pricingConfig}
                 />
            </div>
        </div>
    );

  } catch (err: any) {
      console.error("[Portal] Exception:", err);
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-black text-white p-8">
              <h1 className="text-xl font-bold mb-4">Something went wrong</h1>
              <p>{err.message}</p>
          </div>
      );
  }
}
