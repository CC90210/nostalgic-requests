import { createClient } from "@supabase/supabase-js";
import { RequestFlow } from "@/components/portal/request-flow";
import { notFound } from "next/navigation";
import { DEFAULT_PRICING, PricingConfig } from "@/lib/pricing";
import Image from "next/image";
import Link from "next/link";

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

        // --- GATEKEEPER ---
        if (event.status === "draft") {
            return (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center text-white">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <span className="text-3xl">🎧</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Not Live Yet</h1>
                    <p className="text-gray-400 max-w-md mb-8">
                        The DJ is still setting up the vibe. Check back soon!
                    </p>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25"
                    >
                        Visit Nostalgic Requests
                    </Link>
                </div>
            );
        }

        if (event.status === "ended") {
            return (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center text-white">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                        <span className="text-3xl">🎉</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Event Ended</h1>
                    <p className="text-gray-400 mb-8">Thanks for partying with us!</p>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25"
                    >
                        Visit Nostalgic Requests
                    </Link>
                </div>
            );
        }
        // ------------------

        // Dynamic Pricing Config
        const pricingConfig: PricingConfig = {
            price_single: Number(event.price_single) || DEFAULT_PRICING.price_single,
            price_double: Number(event.price_double) || DEFAULT_PRICING.price_double,
            price_party: Number(event.price_party) || DEFAULT_PRICING.price_party,
            price_priority: Number(event.price_priority) || DEFAULT_PRICING.price_priority,
            price_shoutout: Number(event.price_shoutout) || DEFAULT_PRICING.price_shoutout,
            price_guaranteed: Number(event.price_guaranteed) || DEFAULT_PRICING.price_guaranteed,
        };

        return (
            <div className="min-h-screen bg-[#0A0A0B] text-white">
                <div className="p-6 text-center border-b border-white/10 bg-white/5 backdrop-blur-lg">
                    <h1 className="text-2xl font-bold">{event.name}</h1>
                    <p className="text-gray-400">{event.venue_name}</p>
                </div>
                <div className="p-4">
                    <RequestFlow
                        eventId={event.id}
                        eventSlug={event.unique_slug}
                        pricingConfig={pricingConfig}
                    />

                    {/* Branding Footer - Clickable to Homepage */}
                    <div className="py-6 flex justify-center">
                        <Link href="/" className="flex items-center gap-2 text-gray-500 text-xs opacity-60 hover:opacity-100 transition-opacity">
                            <span>Powered by</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded overflow-hidden bg-black border border-white/20">
                                    <Image src="/logo.png" alt="Logo" width={16} height={16} className="w-full h-full object-cover" />
                                </div>
                                <span className="font-semibold text-white">Nostalgic</span>
                            </div>
                        </Link>
                    </div>

                </div>
            </div>
        );

    } catch (err: any) {
        console.error("[Portal] Exception:", err);
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-black text-white p-8">
                <h1 className="text-xl font-bold mb-4">System Error</h1>
                <p className="text-gray-400 mb-6">{err.message}</p>
                <Link
                    href="/"
                    className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                    Go to Homepage
                </Link>
            </div>
        );
    }
}
