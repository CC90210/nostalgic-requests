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
    try {
      const supabase = getSupabase();

      const { data: liveEvent } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'live')
        .maybeSingle();

      const { data: events } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: requests } = await supabase
        .from('requests')
        .select('amount_paid');

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
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Good evening, DJ ??
        </h1>
        <p className="text-gray-400 mt-1">Ready to rock tonight?</p>
      </div>

      {/* Live Event Banner */}
      {stats.liveEvent && (
        <div className="mb-8 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-red-400 text-sm font-semibold uppercase tracking-wide">Live Now</span>
          </div>
          <h2 className="text-2xl font-bold text-white">{stats.liveEvent.name}</h2>
          <p className="text-gray-300 mt-1">{stats.liveEvent.venue_name}</p>
          <Link
            href="/dashboard/live"
            className="inline-block mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
          >
            Open Live Dashboard ?
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-2xl p-5 border border-green-500/30">
          <div className="text-3xl mb-2">??</div>
          <div className="text-3xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</div>
          <div className="text-gray-400 text-sm mt-1">Total Revenue</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-2xl p-5 border border-purple-500/30">
          <div className="text-3xl mb-2">??</div>
          <div className="text-3xl font-bold text-white">{stats.totalEvents}</div>
          <div className="text-gray-400 text-sm mt-1">Total Events</div>
        </div>
        
        <div className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 rounded-2xl p-5 border border-pink-500/30">
          <div className="text-3xl mb-2">??</div>
          <div className="text-3xl font-bold text-white">{stats.totalRequests}</div>
          <div className="text-gray-400 text-sm mt-1">Total Requests</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-2xl p-5 border border-blue-500/30">
          <div className="text-3xl mb-2">??</div>
          <div className="text-3xl font-bold text-white">{stats.totalLeads}</div>
          <div className="text-gray-400 text-sm mt-1">Total Leads</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/dashboard/new"
          className="block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl p-6 transition-all shadow-lg shadow-purple-500/20"
        >
          <div className="text-4xl mb-3">??</div>
          <h3 className="text-xl font-bold text-white">Create New Event</h3>
          <p className="text-purple-100 mt-1">Set up a new gig and generate a QR code</p>
        </Link>
        
        <Link
          href="/dashboard/events"
          className="block bg-[#1A1A1B] hover:bg-[#252526] border border-[#2D2D2D] rounded-2xl p-6 transition-all"
        >
          <div className="text-4xl mb-3">??</div>
          <h3 className="text-xl font-bold text-white">View All Events</h3>
          <p className="text-gray-400 mt-1">Manage and review your past events</p>
        </Link>
      </div>

      {/* Recent Events */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recent Events</h2>
        {stats.recentEvents.length === 0 ? (
          <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-8 text-center">
            <p className="text-gray-400 mb-4">No events yet</p>
            <Link href="/dashboard/new" className="text-purple-400 hover:text-purple-300 font-medium">
              Create your first event ?
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
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    event.status === 'live'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : event.status === 'ended'
                      ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
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
