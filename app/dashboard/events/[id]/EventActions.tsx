"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Square, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

function getClientSupabase() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

interface EventActionsProps {
  event: {
    id: string;
    status: string;
  };
  hasPayouts: boolean;
}

export default function EventActions({ event, hasPayouts }: EventActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const updateStatus = async (newStatus: string) => {
    setIsLoading(true);
    try {
      const supabase = getClientSupabase();
      
      const { error } = await supabase
        .from("events")
        .update({ status: newStatus })
        .eq("id", event.id);

      if (error) throw error;

      toast.success(`Event ${newStatus === "live" ? "is now live!" : "has ended"}`);
      router.refresh();
      window.location.reload(); 
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error("Failed to update status");
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
      const supabase = getClientSupabase();
      
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id);

      if (error) throw error;

      toast.success("Event deleted");
      router.push("/dashboard/events");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete event");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {event.status === "draft" && (
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
