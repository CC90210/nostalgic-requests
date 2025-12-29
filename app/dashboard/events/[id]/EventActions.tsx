"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Square, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EventActionsProps {
  event: {
    id: string;
    status: string;
  };
}

export default function EventActions({ event }: EventActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const updateStatus = async (newStatus: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      toast.success(`Event ${newStatus === "live" ? "is now live!" : "has ended"}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update event status");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async () => {
    if (!confirm("Are you sure you want to delete this event? This cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      toast.success("Event deleted");
      router.push("/dashboard/events");
    } catch (error) {
      toast.error("Failed to delete event");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {event.status === "draft" && (
        <button
          onClick={() => updateStatus("live")}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Go Live
        </button>
      )}
      
      {event.status === "live" && (
        <button
          onClick={() => updateStatus("ended")}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
          End Event
        </button>
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

