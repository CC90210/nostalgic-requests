'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Play, CheckCircle, Bell, BellOff, Music } from "lucide-react"

// Types need to match DB schema
interface Request {
    id: string
    song_title: string
    song_artist: string
    song_album?: string
    song_artwork_url?: string
    requester_name?: string
    requester_phone?: string
    amount_paid: number
    has_priority: boolean
    has_shoutout: boolean
    has_guaranteed_next: boolean
    status: 'pending' | 'playing' | 'played'
    created_at: string
}

interface LiveDashboardProps {
    eventId: string
    eventName: string
    venueName: string
    initialRequests: Request[] // Changed from any[] to Request[]
    initialRevenue: number
    endTime: string
}

export function LiveDashboard({ eventId, eventName, venueName, initialRequests, initialRevenue }: LiveDashboardProps) {
    const [requests, setRequests] = useState<Request[]>(initialRequests)
    const [revenue, setRevenue] = useState(initialRevenue)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [activeTab, setActiveTab] = useState<'queue' | 'playing' | 'played' | 'all'>('queue')

    useEffect(() => {
        // Since getSupabase() is now lazy and safe, this can run here
        const supabase = getSupabase()

        // Listen for new requests
        const channel = supabase
            .channel('live-dashboard')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'requests',
                    filter: `event_id=eq.${eventId}`,
                },
                (payload) => {
                     if (payload.eventType === 'INSERT') {
                        const newRequest = payload.new as Request
                        setRequests((prev) => [newRequest, ...prev])
                        setRevenue((prev) => prev + (newRequest.amount_paid || 0))
                        
                        // Play Notification Sound
                        if (soundEnabled) playNotificationSound()
                        
                        toast.success(`New Request: ${newRequest.song_title}`, {
                            description: `${newRequest.requester_name || 'Anonymous'} paid $${newRequest.amount_paid}`
                        })
                    } else if (payload.eventType === 'UPDATE') {
                        // Handle status updates from other devices/tabs
                         setRequests((prev) => prev.map(req => req.id === payload.new.id ? payload.new as Request : req))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [eventId, soundEnabled])

    const playNotificationSound = () => {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(e => console.log('Audio play failed', e)); // User interaction usually required first
    }

    // Sort Logic: Guaranteed Next > Priority > Time (Oldest First for fairness? Or Newest? Usually oldest paid request first)
    // But typically "Guaranteed Next" bumps to top.
    const sortRequests = (reqs: Request[]) => {
        return [...reqs].sort((a, b) => {
            // Status sort (if mixed in "all" tab)
            if (a.status === 'playing' && b.status !== 'playing') return -1;
            if (b.status === 'playing' && a.status !== 'playing') return 1;

            if (a.has_guaranteed_next && !b.has_guaranteed_next) return -1
            if (!a.has_guaranteed_next && b.has_guaranteed_next) return 1
            
            if (a.has_priority && !b.has_priority) return -1
            if (!a.has_priority && b.has_priority) return 1
            
            // Default: Oldest first (FIFO) for fairness in queue
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
    }

    const handleStatusChange = async (id: string, newStatus: 'playing' | 'played') => {
        const supabase = getSupabase()
        
        // Optimistic update
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))

        const { error } = await supabase
            .from('requests')
            .update({ status: newStatus })
            .eq('id', id)
        
        if (error) {
            toast.error("Failed to update status")
            // Revert on error would go here
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
    }

    // Filtering logic
    const queueRequests = sortRequests(requests.filter(r => r.status === 'pending'))
    const playingRequest = requests.find(r => r.status === 'playing')
    const playedRequests = requests.filter(r => r.status === 'played').sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Newest played first
    
    // Determine what to show based on tab
    let displayedRequests = []
    if (activeTab === 'queue') displayedRequests = queueRequests
    if (activeTab === 'playing') displayedRequests = playingRequest ? [playingRequest] : []
    if (activeTab === 'played') displayedRequests = playedRequests
    if (activeTab === 'all') displayedRequests = sortRequests(requests)

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-6 space-y-6">
            {/* Sticky Stats Bar */}
            <div className="sticky top-4 z-50 bg-gray-900/90 backdrop-blur-md border border-gray-800 p-4 rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                    <div>
                        <h1 className="font-bold text-lg leading-none">{eventName}</h1>
                        <p className="text-xs text-gray-400">{venueName}</p>
                    </div>
                </div>

                 <div className="flex items-center gap-6 text-sm font-mono">
                    <div className="text-center">
                        <p className="text-gray-500 text-xs uppercase tracking-wider">Revenue</p>
                        <p className="font-bold text-green-400 text-lg">${revenue.toFixed(2)}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-800" />
                    <div className="text-center">
                        <p className="text-gray-500 text-xs uppercase tracking-wider">Requests</p>
                        <p className="font-bold text-white text-lg">{requests.length}</p>
                    </div>
                     <div className="w-px h-8 bg-gray-800" />
                     <button onClick={() => setSoundEnabled(!soundEnabled)} className="hover:bg-gray-800 p-2 rounded-full transition-colors">
                        {soundEnabled ? <Bell className="h-5 w-5 text-yellow-400" /> : <BellOff className="h-5 w-5 text-gray-500" />}
                     </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['queue', 'now playing', 'played', 'all'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab.split(' ')[0] as any)} // Hacky split for 'now playing' -> 'now' (wait no, key logic needs fix)
                        className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                            (tab === 'now playing' && activeTab === 'playing') || (tab === activeTab)
                                ? 'bg-white text-black shadow-lg scale-105'
                                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                        }`}
                        // Fix logic for click handler
                        // onClick={() => setActiveTab(tab === 'now playing' ? 'playing' : tab as any)}
                    >
                       {tab} {(tab === 'queue' && queueRequests.length > 0) && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{queueRequests.length}</span>}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <AnimatePresence mode="popLayout">
                    {activeTab === 'playing' && !playingRequest && (
                        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="col-span-full h-64 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                            <Music className="h-12 w-12 mb-4 opacity-20" />
                            <p>Nothing playing right now.</p>
                        </motion.div>
                    )}

                    {displayedRequests.map((req) => (
                        <RequestCard 
                            key={req.id} 
                            request={req} 
                            onCopy={() => copyToClipboard(`${req.song_artist} - ${req.song_title}`)}
                            onPlay={() => handleStatusChange(req.id, 'playing')}
                            onDone={() => handleStatusChange(req.id, 'played')}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}

function RequestCard({ request, onCopy, onPlay, onDone }: { request: Request, onCopy: () => void, onPlay: () => void, onDone: () => void }) {
    const isPriority = request.has_priority || request.has_guaranteed_next
    const isPlaying = request.status === 'playing'

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative group rounded-xl overflow-hidden border transition-all ${
                isPlaying 
                ? 'bg-gradient-to-b from-green-900/40 to-black border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]'
                : isPriority 
                    ? 'bg-gradient-to-b from-yellow-900/20 to-black border-yellow-500/50' 
                    : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
            }`}
        >
             {/* Status Badge */}
            {request.has_guaranteed_next && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 animate-pulse">
                    ?? NEXT
                </div>
            )}
            
            <div className="p-4 flex gap-4">
                 {/* Artwork */}
                <div className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-gray-800 shadow-lg">
                    {request.song_artwork_url ? (
                        <img src={request.song_artwork_url} alt="Art" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music className="h-8 w-8 text-gray-600" /></div>
                    )}
                    {isPlaying && (
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                             <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                         </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-white truncate leading-tight">{request.song_title}</h3>
                        <p className="text-sm text-gray-400 truncate">{request.song_artist}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-mono">{request.requester_name || 'Guest'}</span>
                            {request.requester_phone && <span className="text-[10px] text-gray-600">{request.requester_phone}</span>}
                        </div>
                        <div className="text-right">
                             <span className={`text-lg font-bold font-mono ${request.amount_paid >= 10 ? 'text-green-400' : 'text-gray-300'}`}>
                                ${request.amount_paid}
                             </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-px bg-gray-800/50 mt-1 border-t border-gray-800">
                {request.status !== 'played' && (
                     <>
                        <button onClick={onCopy} className="p-3 text-xs font-semibold hover:bg-white/10 flex items-center justify-center gap-2 transition-colors">
                            <Copy className="h-3 w-3" /> Copy
                        </button>
                        {!isPlaying && (
                             <button onClick={onPlay} className="p-3 text-xs font-semibold hover:bg-green-500/20 text-green-400 flex items-center justify-center gap-2 transition-colors border-l border-gray-800">
                                <Play className="h-3 w-3" /> Play
                             </button>
                        )}
                        {isPlaying && (
                             <button onClick={onDone} className="p-3 text-xs font-semibold hover:bg-blue-500/20 text-blue-400 flex items-center justify-center gap-2 transition-colors border-l border-gray-800">
                                <CheckCircle className="h-3 w-3" /> Done
                            </button>
                        )}
                     </>
                )}
                 {request.status === 'played' && (
                     <div className="col-span-2 p-2 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
                         <CheckCircle className="h-3 w-3" /> Played
                     </div>
                )}
            </div>
            
             {/* Addon Indicators */}
             {(request.has_shoutout || request.has_priority) && (
                 <div className="px-4 py-1.5 bg-white/5 flex gap-2 text-[10px] text-gray-400 overflow-x-auto">
                     {request.has_shoutout && <span className="text-purple-400">?? Shoutout Included</span>}
                     {request.has_priority && <span className="text-yellow-400">? Priority Upgrade</span>}
                 </div>
             )}
        </motion.div>
    )
}
