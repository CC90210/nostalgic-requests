"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, BellOff, Clock, Copy, DollarSign, MessageSquare, Music, CheckCircle, Disc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"

interface LiveDashboardProps {
  eventId: string
  eventName: string
  venueName: string
  initialRequests: any[]
  initialRevenue: number
  endTime: string
}

export function LiveDashboard({ 
    eventId, 
    eventName, 
    venueName, 
    initialRequests, 
    initialRevenue,
    endTime 
}: LiveDashboardProps) {
  const [requests, setRequests] = useState<any[]>(initialRequests)
  const [revenue, setRevenue] = useState(initialRevenue)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState("queue")

  useEffect(() => {
    const channel = supabase
      .channel("live-requests")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "requests",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newRequest = payload.new
          setRequests(prev => [newRequest, ...prev])
          setRevenue(prev => prev + newRequest.amount_paid)
          
          if (soundEnabled) {
             const audio = new Audio("/notification.mp3") // Placeholder (needs real file)
             audio.play().catch(() => {})
          }
          
          toast.success(`New request: ${newRequest.song_title}`)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "requests",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new : r))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, soundEnabled])

  const handleStatusChange = async (requestId: string, status: string) => {
      try {
           const { error } = await supabase
            .from("requests")
            .update({ status, played_at: status === "played" ? new Date().toISOString() : null })
            .eq("id", requestId)

            if (error) throw error
            
             // Optimistic update
             setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r))
             
             if(status === "playing") toast.info("Marked as Now Playing")
             if(status === "played") toast.success("Request completed!")
             
      } catch (error) {
          console.error(error)
          toast.error("Failed to update status")
      }
  }

  const copySong = (artist: string, title: string) => {
      navigator.clipboard.writeText(`${artist} - ${title}`)
      toast.success("Copied to clipboard")
  }

  // Sorting logic
  const sortedRequests = [...requests].sort((a, b) => {
      // 1. Guaranteed Next
      if (a.has_guaranteed_next && !b.has_guaranteed_next) return -1
      if (!a.has_guaranteed_next && b.has_guaranteed_next) return 1
      
      // 2. Priority
      if (a.has_priority && !b.has_priority) return -1
      if (!a.has_priority && b.has_priority) return 1
      
      // 3. Time (Oldest first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  // Filtering
  const pendingRequests = sortedRequests.filter(r => r.status === "pending")
  const playingRequests = sortedRequests.filter(r => r.status === "playing")
  const playedRequests = sortedRequests.filter(r => r.status === "played")

  return (
    <div className="space-y-6">
        {/* Sticky Stats Bar */}
        <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-10 backdrop-blur opacity-95">
             <div>
                <div className="flex items-center gap-2">
                     <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <h2 className="font-bold text-lg">{eventName}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{venueName}</p>
             </div>
             
             <div className="flex gap-6 text-sm">
                 <div className="flex flex-col items-center">
                     <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4" /> Revenue</span>
                     <span className="font-bold text-lg text-green-500">${revenue.toFixed(2)}</span>
                 </div>
                 <div className="flex flex-col items-center">
                     <span className="text-muted-foreground flex items-center gap-1"><Music className="h-4 w-4" /> Requests</span>
                     <span className="font-bold text-lg">{requests.length}</span>
                 </div>
                  <div className="flex flex-col items-center">
                     <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> Ends In</span>
                     <span className="font-bold text-lg">
                        {/* Simple countdown placeholder, ideally use hook */}
                        Live
                     </span>
                 </div>
             </div>

             <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
                 {soundEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
             </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="queue">Queue ({pendingRequests.length})</TabsTrigger>
                <TabsTrigger value="playing">Now Playing ({playingRequests.length})</TabsTrigger>
                <TabsTrigger value="played">Played ({playedRequests.length})</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <div className="mt-6">
                <AnimatePresence mode="popLayout">
                    {(activeTab === "queue" ? pendingRequests : activeTab === "playing" ? playingRequests : activeTab === "played" ? playedRequests : sortedRequests).map((request) => (
                        <motion.div 
                            key={request.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            layout
                            className="mb-4"
                        >
                            <Card className={`overflow-hidden ${request.has_guaranteed_next ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : request.has_priority ? "border-orange-500/50" : ""}`}>
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Artwork & Main Info */}
                                        <div className="flex-1 p-4 flex gap-4 items-start">
                                            <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden bg-secondary">
                                                {request.song_artwork_url ? (
                                                    <Image src={request.song_artwork_url} alt={request.song_title} fill className="object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center"><Disc className="h-8 w-8 text-muted-foreground" /></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-start justify-between gap-2">
                                                     <div>
                                                         <h3 className="font-bold text-lg leading-tight truncate">{request.song_title}</h3>
                                                         <p className="text-muted-foreground">{request.song_artist}</p>
                                                     </div>
                                                     <div className="flex flex-col items-end gap-1">
                                                         <span className="font-bold text-green-500">${request.amount_paid}</span>
                                                          {request.has_guaranteed_next && <Badge variant="destructive" className="whitespace-nowrap">?? NEXT</Badge>}
                                                          {request.has_priority && !request.has_guaranteed_next && <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 whitespace-nowrap">? PRIORITY</Badge>}
                                                     </div>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    <div className="text-sm bg-secondary/50 px-2 py-1 rounded">
                                                        Requested by <span className="font-bold">{request.requester_name || "Guest"}</span>
                                                    </div>
                                                     <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(request.created_at))} ago
                                                    </div>
                                                </div>

                                                 {request.has_shoutout && (
                                                     <div className="mt-2 bg-pink-500/10 text-pink-500 border border-pink-500/20 px-3 py-2 rounded-md flex items-center gap-2">
                                                         <MessageSquare className="h-4 w-4" />
                                                         <span className="font-bold text-sm">SHOUTOUT REQUIRED</span>
                                                     </div>
                                                 )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="bg-secondary/20 p-4 flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l md:w-32">
                                            <Button size="sm" variant="outline" onClick={() => copySong(request.song_artist, request.song_title)} title="Copy Song">
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => toast.info("SMS feature coming soon")} title="Send SMS">
                                                <MessageSquare className="h-4 w-4" />
                                            </Button>
                                            
                                            {request.status === "pending" && (
                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleStatusChange(request.id, "playing")} title="Mark Playing">
                                                    <Disc className="h-4 w-4" />
                                                </Button>
                                            )}
                                            
                                            {request.status === "playing" && (
                                                 <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusChange(request.id, "played")} title="Mark Done">
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
                 
                 {/* Empty States */}
                {pendingRequests.length === 0 && activeTab === "queue" && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p className="text-xl mb-2">??</p>
                        No pending requests. You''re all caught up!
                    </div>
                )}
            </div>
        </Tabs>
    </div>
  )
}
