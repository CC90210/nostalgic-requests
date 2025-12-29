import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from "@/components/ui/button"
import Link from 'next/link';

// CRITICAL: This prevents static generation
export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  // Handle build time gracefully
  if (!isSupabaseConfigured()) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Events</h1>
        <p className="text-gray-400">Loading events...</p>
      </div>
    );
  }

  const supabase = getSupabase();
  
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch events:', error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Events</h1>
        <p className="text-red-400">Failed to load events</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link
          href="/dashboard/new"
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
        >
          + New Event
        </Link>
      </div>

      {!events || events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No events yet</p>
          <Link
            href="/dashboard/new"
            className="text-purple-400 hover:text-purple-300"
          >
            Create your first event ?
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/events/${event.id}`}
              className="block bg-[#1A1A1B] p-4 rounded-lg hover:bg-[#252526] transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{event.name}</h2>
                  <p className="text-gray-400 text-sm">{event.venue_name}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    event.status === 'live'
                      ? 'bg-green-500/20 text-green-400'
                      : event.status === 'ended'
                      ? 'bg-gray-500/20 text-gray-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {event.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
