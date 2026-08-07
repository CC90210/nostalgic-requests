"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Square, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface EventActionsProps {
  event: {
    id: string;
    status: string;
  };
  hasPayouts: boolean;
}

export default function EventActions({ event, hasPayouts }: EventActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(event.status); // Optimistic State
  const router = useRouter();

  const updateStatus = async (newStatus: string) => {
    // 1. Optimistic Update
    const oldStatus = currentStatus;
    setCurrentStatus(newStatus); 
    
    // 2. Background sync. Ownership is checked server-side — the browser can no
    // longer write to the database directly, and `.eq("id", …)` alone was only
    // ever safe because RLS was underneath it.
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `Update failed (${res.status})`);
      }

      toast.success(`Event is now ${newStatus}!`);
      router.refresh(); // Update server components in background

    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update status");
      setCurrentStatus(oldStatus); // Revert on failure
    }
  };

  const deleteEvent = async () => {
    if (!confirm("Are you sure you want to delete this event? This cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `Delete failed (${res.status})`);
      }

      toast.success("Event deleted");
      router.push("/dashboard/events");
    } catch (error: any) {
      // Surface the real reason — the server refuses to delete events that
      // carry paid requests, and "Failed to delete event" hides that.
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete event");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {currentStatus === "draft" && (
        !hasPayouts ? (
            <Link 
                href="/dashboard/settings"
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/50 rounded-xl text-yellow-400 font-medium transition-colors"
            >
                <AlertTriangle className="w-4 h-4" />
                Setup Payouts to Go Live
            </Link>
        ) : (
            <button
            onClick={() => updateStatus("live")}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
            >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Go Live
            </button>
        )
      )}
      
      {currentStatus === "live" && (
        <button
          onClick={() => updateStatus("ended")}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
          >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
          End Event
        </button>
      )}

      {currentStatus === "ended" && (
          <span className="px-4 py-2 bg-gray-800 rounded-xl text-gray-400 font-medium cursor-not-allowed">
              Event Ended
          </span>
      )}

      <button
        onClick={deleteEvent}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-xl text-red-400 font-medium transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
