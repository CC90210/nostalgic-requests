"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  QrCode, 
  ExternalLink,
  Play,
  DollarSign,
  Music,
  Clock,
  Loader2
} from "lucide-react";
import QRCodeActions from "./QRCodeActions";
import EventActions from "./EventActions";
import EventQRCode from "@/components/dashboard/EventQRCode";
import LocalTimeDisplay from "@/components/dashboard/LocalTimeDisplay";
import EventPricingEditor from "@/components/dashboard/EventPricingEditor";

function getClientSupabase() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export default function EventDetailsPage() {
  const { id } = useParams();
  const { user, profile, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to be ready
    if (authLoading) return;
    
    if (!user) {
        setLoading(false);
        return;
    }

    const fetchData = async () => {
        try {
            const supabase = getClientSupabase();
            const eventId = Array.isArray(id) ? id[0] : id;

            // 1. Fetch Event (RLS Filtered)
            const { data: eventData, error: eventError } = await supabase
                .from("events")
                .select("*")
                .eq("id", eventId)
                .single();

            if (eventError) throw eventError;
            if (!eventData) throw new Error("Event not found");

            setEvent(eventData);

            // 2. Fetch Stats
            const { data: requests, error: reqError } = await supabase
                .from("requests")
                .select("amount_paid, status")
                .eq("event_id", eventId)
                .eq("is_paid", true);

            if (reqError) console.error("Stats error:", reqError);

            const statsData = {
                totalRequests: requests?.length || 0,
                totalRevenue: requests?.reduce((sum, r) => sum + Number(r.amount_paid || 0), 0) || 0,
                pendingRequests: requests?.filter(r => r.status === "pending").length || 0,
                playedRequests: requests?.filter(r => r.status === "played").length || 0,
            };
            setStats(statsData);

        } catch (err: any) {
            console.error("Detail fetch error:", err);
            setError(err.message || "Failed to load event");
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [id, user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
            <div className="text-center">
                <h2 className="text-xl text-red-500 font-bold mb-2">Access Denied</h2>
                <p className="text-gray-400 mb-4">{error || "You do not have permission to view this event."}</p>
                <Link href="/dashboard/events" className="text-purple-400 hover:text-purple-300 underline">
                    Return to My Events
                </Link>
            </div>
        </div>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nostalgicrequests.com";
  const portalUrl = `${appUrl}/e/${event.unique_slug}`;

  const initialPricing = {
    price_single: Number(event.price_single) || 5,
    price_double: Number(event.price_double) || 8,
    price_party: Number(event.price_party) || 12,
    price_priority: Number(event.price_priority) || 10,
    price_shoutout: Number(event.price_shoutout) || 5,
    price_guaranteed: Number(event.price_guaranteed) || 20,
  };

  // SUPER ADMIN OVERRIDE
  const isPlatformOwner = user?.email?.toLowerCase() === "konamak@icloud.com";
  const hasPayouts = !!profile?.stripe_onboarding_complete || isPlatformOwner;

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{event.name}</h1>
              <StatusBadge status={event.status} />
            </div>
            <p className="text-gray-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {event.venue_name}
              {event.venue_address && ` - ${event.venue_address}`}
            </p>
          </div>
          <EventActions event={event} hasPayouts={hasPayouts} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<DollarSign className="w-5 h-5" />} value={`$${stats?.totalRevenue.toFixed(2) || "0.00"}`} label="Revenue" color="green" />
          <StatCard icon={<Music className="w-5 h-5" />} value={stats?.totalRequests.toString() || "0"} label="Total Requests" color="purple" />
          <StatCard icon={<Clock className="w-5 h-5" />} value={stats?.pendingRequests.toString() || "0"} label="Pending" color="yellow" />
          <StatCard icon={<Play className="w-5 h-5" />} value={stats?.playedRequests.toString() || "0"} label="Played" color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. QR Code */}
          <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-400" />
              QR Code (Live)
            </h2>
            
            <div className="flex flex-col items-center">
              <EventQRCode slug={event.unique_slug} />
              
              <div className="mt-4 w-full">
                <QRCodeActions qrCodeUrl={event.qr_code_url} portalUrl={portalUrl} />
              </div>
            </div>

            <div className="mt-4 p-3 bg-[#0A0A0B] rounded-xl">
              <p className="text-gray-400 text-xs mb-1">Public Portal URL (Verified)</p>
              <div className="flex items-center gap-2">
                <code className="text-purple-400 text-sm flex-1 truncate">{portalUrl}</code>
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-[#2D2D2D] rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            </div>
          </div>

          {/* 2. Pricing Editor */}
          <EventPricingEditor eventId={event.id} initialPricing={initialPricing} />

          {/* 3. Event Details */}
          <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Event Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Date & Time</p>
                <LocalTimeDisplay start={event.start_time} end={event.end_time} />
              </div>

              <div>
                <p className="text-gray-400 text-sm">Event Type</p>
                <p className="text-white capitalize">{event.event_type}</p>
              </div>

              {event.custom_message && (
                <div>
                  <p className="text-gray-400 text-sm">Custom Message</p>
                  <p className="text-white">{event.custom_message}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {event.status === "live" && (
          <div className="mt-6">
            <Link
              href="/dashboard/live"
              className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl p-4 text-center text-white font-semibold transition-all shadow-lg shadow-purple-500/20"
            >
              Open Live Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: "bg-green-500/20 text-green-400 border-green-500/30",
    ended: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.draft}`}>
      {status === "live" && <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    green: "text-green-400 bg-green-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    yellow: "text-yellow-400 bg-yellow-500/10",
    blue: "text-blue-400 bg-blue-500/10",
  };

  return (
    <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-xl p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}

