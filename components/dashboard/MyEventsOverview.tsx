"use client";

import Link from "next/link";
import { CalendarDays, Plus, MapPin } from "lucide-react";
import LocalTimeDisplay from "@/components/dashboard/LocalTimeDisplay";

interface Event {
  id: string;
  name: string;
  venue_name: string;
  status: string;
  start_time: string;
}

interface MyEventsOverviewProps {
  events: Event[];
}

export default function MyEventsOverview({ events }: MyEventsOverviewProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Events</h1>
            <p className="text-gray-400 mt-1">Manage your DJ gigs</p>
          </div>
          <Link
            href="/dashboard/new"
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-2 rounded-xl text-white font-medium transition-all"
          >
            <Plus className="w-5 h-5" />
            New Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-12 text-center">
            <CalendarDays className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No events yet</h2>
            <p className="text-gray-400 mb-6">Create your first event to start accepting song requests!</p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-xl text-white font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="block bg-[#1A1A1B] border border-[#2D2D2D] hover:border-purple-500/50 rounded-2xl p-5 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{event.name}</h2>
                    <p className="text-gray-400 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.venue_name}
                    </p>
                    {event.start_time && (
                      <LocalTimeDisplay start={event.start_time} simple />
                    )}
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
