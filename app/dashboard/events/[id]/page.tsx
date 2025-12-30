import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  QrCode, 
  ExternalLink,
  Play,
  DollarSign,
  Music
} from "lucide-react";
import QRCodeActions from "./QRCodeActions";
import EventActions from "./EventActions";
import EventQRCode from "@/components/dashboard/EventQRCode";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const supabase = getSupabaseAdmin();
  
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", resolvedParams.id)
    .single();

  if (error || !event) {
    notFound();
  }

  const { data: requests } = await supabase
    .from("requests")
    .select("amount_paid, status")
    .eq("event_id", event.id);

  const stats = {
    totalRequests: requests?.length || 0,
    totalRevenue: requests?.reduce((sum, r) => sum + Number(r.amount_paid || 0), 0) || 0,
    pendingRequests: requests?.filter(r => r.status === "pending").length || 0,
    playedRequests: requests?.filter(r => r.status === "played").length || 0,
  };

  // Use production URL for portal text link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nostalgic-requests.vercel.app";
  const portalUrl = `${appUrl}/e/${event.unique_slug}`;

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
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
          <EventActions event={event} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<DollarSign className="w-5 h-5" />} value={`$${stats.totalRevenue.toFixed(2)}`} label="Revenue" color="green" />
          <StatCard icon={<Music className="w-5 h-5" />} value={stats.totalRequests.toString()} label="Total Requests" color="purple" />
          <StatCard icon={<Clock className="w-5 h-5" />} value={stats.pendingRequests.toString()} label="Pending" color="yellow" />
          <StatCard icon={<Play className="w-5 h-5" />} value={stats.playedRequests.toString()} label="Played" color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-400" />
              QR Code (Live)
            </h2>
            
            <div className="flex flex-col items-center">
              {/* Force Client-Side Generation of correct URL */}
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

          <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Event Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Date & Time</p>
                <p className="text-white">
                  {new Date(event.start_time).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-gray-300">
                  {new Date(event.start_time).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {" - "}
                  {new Date(event.end_time).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
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
