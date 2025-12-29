import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let stats = {
    totalRevenue: 0,
    totalEvents: 0,
    totalRequests: 0,
    totalLeads: 0,
    liveEvent: null as any,
    recentEvents: [] as any[],
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();

    // Get live event
    const { data: liveEvent } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'live')
      .single();

    // Get all events
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Get all requests for revenue calculation
    const { data: requests } = await supabase
      .from('requests')
      .select('amount_paid');

    // Get leads count
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    stats = {
      totalRevenue: requests?.reduce((sum, r) => sum + Number(r.amount_paid || 0), 0) || 0,
      totalEvents: events?.length || 0,
      totalRequests: requests?.length || 0,
      totalLeads: leadsCount || 0,
      liveEvent,
      recentEvents: events || [],
    };
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Good evening, DJ ??
        </h1>
        <p className="text-gray-400 mt-1">Ready to rock tonight?</p>
      </div>

      {/* Live Event Banner */}
      {stats.liveEvent && (
        <div className="mb-8 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30 relative overflow-hidden">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-sm font-medium">LIVE NOW</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{stats.liveEvent.name}</h2>
          <p className="text-gray-300">{stats.liveEvent.venue_name}</p>
          <Link
            href="/dashboard/live"
            className="mt-4 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white transition"
          >
            Open Live Dashboard ?
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon="??"
          color="green"
        />
        <StatCard
          label="Total Events"
          value={stats.totalEvents.toString()}
          icon="??"
          color="purple"
        />
        <StatCard
          label="Total Requests"
          value={stats.totalRequests.toString()}
          icon="??"
          color="pink"
        />
        <StatCard
          label="Total Leads"
          value={stats.totalLeads.toString()}
          icon="??"
          color="blue"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/dashboard/new"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl p-6 transition shadow-lg shadow-purple-500/20"
        >
          <div className="text-3xl mb-2">??</div>
          <h3 className="text-lg font-semibold text-white">Create New Event</h3>
          <p className="text-purple-200 text-sm mt-1">
            Set up a new gig and generate a QR code
          </p>
        </Link>
        <Link
          href="/dashboard/events"
          className="bg-[#1A1A1B] hover:bg-[#252526] border border-[#2D2D2D] rounded-xl p-6 transition"
        >
          <div className="text-3xl mb-2">??</div>
          <h3 className="text-lg font-semibold text-white">View All Events</h3>
          <p className="text-gray-400 text-sm mt-1">
            Manage and review your past events
          </p>
        </Link>
      </div>

      {/* Recent Events */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recent Events</h2>
        {stats.recentEvents.length === 0 ? (
          <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-4">No events yet</p>
            <Link
              href="/dashboard/new"
              className="text-purple-400 hover:text-purple-300"
            >
              Create your first event ?
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="block bg-[#1A1A1B] border border-[#2D2D2D] rounded-xl p-4 hover:border-purple-500/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{event.name}</h3>
                    <p className="text-gray-400 text-sm">{event.venue_name}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      event.status === 'live'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : event.status === 'ended'
                        ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}
                  >
                    {event.status === 'live' ? '?? Live' : event.status === 'ended' ? 'Ended' : 'Draft'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: 'green' | 'purple' | 'pink' | 'blue';
}) {
  const colors = {
    green: 'from-green-900/30 to-green-800/30 border-green-500/30',
    purple: 'from-purple-900/30 to-purple-800/30 border-purple-500/30',
    pink: 'from-pink-900/30 to-pink-800/30 border-pink-500/30',
    blue: 'from-blue-900/30 to-blue-800/30 border-blue-500/30',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}
