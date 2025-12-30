"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { DollarSign, Calendar, Music, Users, Plus, List, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalEvents: 0,
    totalRequests: 0,
    liveEvent: null as any,
    recentEvents: [] as any[],
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setDataLoading(false);
        return;
      }

      try {
        // Fetch events via API to bypass RLS
        const response = await fetch("/api/events");
        const data = await response.json();
        
        if (data.events) {
          const events = data.events;
          const liveEvent = events.find((e: any) => e.status === "live") || null;
          
          setStats({
            totalRevenue: 0,
            totalEvents: events.length,
            totalRequests: 0,
            liveEvent,
            recentEvents: events.slice(0, 5),
          });
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setDataLoading(false);
      }
    };

    if (!loading) {
      fetchDashboardData();
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const djName = profile?.dj_name || "DJ";

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome back, {djName}!</h1>
        <p className="text-gray-400 mt-1">Here is your dashboard overview.</p>
      </div>

      {stats.liveEvent && (
        <div className="mb-8 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-sm font-semibold uppercase tracking-wide">Live Now</span>
          </div>
          <h2 className="text-2xl font-bold text-white">{stats.liveEvent.name}</h2>
          <p className="text-gray-300 mt-1">{stats.liveEvent.venue_name}</p>
          <Link
            href="/dashboard/live"
            className="inline-flex items-center gap-2 mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
          >
            Open Live Dashboard
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<DollarSign className="w-6 h-6" />} value={`$${stats.totalRevenue.toFixed(2)}`} label="Total Revenue" color="green" />
        <StatCard icon={<Calendar className="w-6 h-6" />} value={stats.totalEvents.toString()} label="Total Events" color="purple" />
        <StatCard icon={<Music className="w-6 h-6" />} value={stats.totalRequests.toString()} label="Total Requests" color="pink" />
        <StatCard icon={<Users className="w-6 h-6" />} value={profile?.phone || "-"} label="Your Phone" color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/dashboard/new"
          className="flex items-center gap-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl p-6 transition-all shadow-lg shadow-purple-500/20"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Create New Event</h3>
            <p className="text-purple-100">Set up a new gig and generate a QR code</p>
          </div>
        </Link>
        
        <Link
          href="/dashboard/events"
          className="flex items-center gap-4 bg-[#1A1A1B] hover:bg-[#252526] border border-[#2D2D2D] rounded-2xl p-6 transition-all"
        >
          <div className="w-12 h-12 bg-[#2D2D2D] rounded-xl flex items-center justify-center">
            <List className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">View All Events</h3>
            <p className="text-gray-400">Manage and review your past events</p>
          </div>
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recent Events</h2>
        {dataLoading ? (
          <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-8 text-center">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
          </div>
        ) : stats.recentEvents.length === 0 ? (
          <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No events yet</p>
            <Link href="/dashboard/new" className="text-purple-400 hover:text-purple-300 font-medium">
              Create your first event
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="block bg-[#1A1A1B] border border-[#2D2D2D] hover:border-purple-500/50 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{event.name}</h3>
                    <p className="text-gray-400 text-sm">{event.venue_name}</p>
                  </div>
                  <StatusBadge status={event.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    green: "from-green-600/20 to-green-800/20 border-green-500/30 text-green-400",
    purple: "from-purple-600/20 to-purple-800/20 border-purple-500/30 text-purple-400",
    pink: "from-pink-600/20 to-pink-800/20 border-pink-500/30 text-pink-400",
    blue: "from-blue-600/20 to-blue-800/20 border-blue-500/30 text-blue-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}>
      <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center mb-3">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-gray-400 text-sm mt-1">{label}</div>
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

