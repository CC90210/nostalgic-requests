"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle, Bell, BellOff, Music, Mic2, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Request {
  id: string;
  song_title: string;
  song_artist: string;
  song_artwork_url?: string;
  requester_name?: string;
  amount_paid: number;
  has_priority: boolean;
  has_shoutout: boolean;
  has_guaranteed_next: boolean;
  status: "pending" | "playing" | "played";
  created_at: string;
  is_paid: boolean;
}

export function LiveDashboard({ eventId, eventName, initialRequests, initialRevenue }: any) {
  // FILTER INITIAL REQUESTS TO PAID ONLY
  const [requests, setRequests] = useState<Request[]>(
     (initialRequests as Request[]).filter(r => r.is_paid !== false)
  );
  const [revenue, setRevenue] = useState(initialRevenue);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel("live-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests", filter: `event_id=eq.${eventId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
             // A draft was created (is_paid=false). Ignore it UI-wise?
             // Actually, Realtime will catch Drafts now. We must check is_paid.
             // But wait, Drafts are INSERT.
             // Payment Success is UPDATE.
             const newReq = payload.new as Request;
             if (newReq.is_paid) {
                 addRequestToFeed(newReq);
             }
          } else if (payload.eventType === "UPDATE") {
             const updatedReq = payload.new as Request;
             // If a draft becomes paid, treat it like an insert!
             if (updatedReq.is_paid && !requests.some(r => r.id === updatedReq.id)) {
                 addRequestToFeed(updatedReq);
             } else {
                 setRequests((p) => p.map((r) => (r.id === payload.new.id ? updatedReq : r)));
             }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId, soundEnabled, requests]); // Dependency on requests for duplication check

  const addRequestToFeed = (req: Request) => {
      setRequests((p) => {
          if (p.some(existing => existing.id === req.id)) return p;
          return [req, ...p];
      });
      // Revenue calculation might be tricky if it was already counted?
      // Dashboard sends initialRevenue.
      // If we add a new req, we add to revenue.
      // If we update a draft to paid, we add to revenue.
      setRevenue((p: number) => p + (req.amount_paid || 0));
      if (soundEnabled) new Audio("/sounds/notification.mp3").play().catch(() => {});
      toast.success(`New Request: ${req.song_title}`);
  }

  const handleCreateStatus = async (id: string, status: "played" | "playing") => {
     setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
     const supabase = getSupabase();
     await supabase.from("requests").update({ status }).eq("id", id);
  };

  const pendingRequests = requests.filter((r) => r.status === "pending" && r.is_paid).sort((a,b) => {
       if (a.has_guaranteed_next !== b.has_guaranteed_next) return a.has_guaranteed_next ? -1 : 1;
       if (a.has_priority !== b.has_priority) return a.has_priority ? -1 : 1;
       return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const playingRequest = requests.find(r => r.status === "playing" && r.is_paid);
  const recentPlayed = requests.filter(r => r.status === "played" && r.is_paid).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <div className="min-h-screen bg-black text-white p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-900 p-4 rounded-xl border border-gray-800">
        <div>
          <h1 className="text-xl font-bold">{eventName}</h1>
          <p className="text-green-400 font-mono font-bold">${revenue.toFixed(2)} Revenue</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
           {soundEnabled ? <Bell className="text-yellow-400" /> : <BellOff className="text-gray-500" />}
        </Button>
      </div>

      {/* NOW PLAYING CARD */}
      {playingRequest && (
        <Card className="bg-gradient-to-r from-green-900/40 to-black border-green-500/50">
            <CardHeader><CardTitle className="text-green-400 animate-pulse text-sm uppercase">Now Playing</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <img src={playingRequest.song_artwork_url || "https://placehold.co/100"} className="w-16 h-16 rounded object-cover shadow-lg" />
                    <div>
                        <h3 className="font-bold text-xl text-white">{playingRequest.song_title}</h3>
                        <p className="text-gray-300">{playingRequest.song_artist}</p>
                    </div>
                 </div>
                 <Button onClick={() => handleCreateStatus(playingRequest.id, "played")}>Mark Done</Button>
            </CardContent>
        </Card>
      )}

      {/* LIVE FEED LIST */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
           <CardTitle className="flex justify-between items-center text-white">
              Incoming Requests
              <span className="bg-gray-800 text-xs px-2 py-1 rounded-full">{pendingRequests.length}</span>
           </CardTitle>
        </CardHeader>
        <CardContent>
           {pendingRequests.length === 0 && !playingRequest ? (
               <div className="text-center py-10 text-gray-500">Waiting for requests...</div>
           ) : (
               <ul className="space-y-4">
                  <AnimatePresence>
                  {pendingRequests.map((req) => (
                      <motion.li 
                        key={req.id} 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
                        className={`flex items-center justify-between p-3 rounded-lg border ${ req.has_priority || req.has_guaranteed_next ? "bg-amber-950/20 border-amber-500/30" : "bg-black/40 border-gray-800"}`}
                      >
                         <div className="flex items-center gap-3 overflow-hidden">
                             {/* Art */}
                             <img src={req.song_artwork_url || "https://placehold.co/60"} className="w-12 h-12 rounded object-cover bg-gray-800 shrink-0" />
                             
                             {/* Info */}
                             <div className="min-w-0">
                                 <h4 className="font-bold text-white truncate">{req.song_title}</h4>
                                 <p className="text-sm text-gray-400 truncate">{req.song_artist}</p>
                                 <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                                    <span>{req.requester_name}</span>
                                    {req.has_shoutout && <span className="text-cyan-400 flex items-center gap-0.5"><Mic2 className="w-3 h-3"/> Shoutout</span>}
                                    {(req.has_priority || req.has_guaranteed_next) && <span className="text-amber-400 flex items-center gap-0.5"><Zap className="w-3 h-3"/> Priority</span>}
                                 </div>
                             </div>
                         </div>
                         
                         {/* Right Side */}
                         <div className="flex items-center gap-3 shrink-0 pl-2">
                             <span className={`font-mono font-bold ${req.amount_paid >= 5 ? "text-green-400" : "text-gray-500"}`}>${req.amount_paid}</span>
                             <Button size="sm" variant="outline" className="h-8 border-green-900 text-green-500 hover:bg-green-900/50 hover:text-green-400" onClick={() => handleCreateStatus(req.id, "playing")}>
                                <Play className="w-3 h-3 mr-1" /> Play
                             </Button>
                         </div>
                      </motion.li>
                  ))}
                  </AnimatePresence>
               </ul>
           )}
        </CardContent>
      </Card>

      {/* RECENTLY PLAYED */}
      {recentPlayed.length > 0 && (
         <div className="opacity-50 hover:opacity-100 transition-opacity">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Recently Played</h3>
             <ul className="space-y-2">
                {recentPlayed.map(req => (
                    <li key={req.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-800 last:border-0">
                         <span className="text-gray-400">{req.song_title} <span className="text-gray-600">- {req.song_artist}</span></span>
                         <CheckCircle className="w-4 h-4 text-green-900" />
                    </li>
                ))}
            </ul>
         </div>
      )}
    </div>
  );
}
