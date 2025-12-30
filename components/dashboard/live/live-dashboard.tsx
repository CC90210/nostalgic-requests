'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Play, CheckCircle, Bell, BellOff, Music, Mic2, Zap, Crown } from "lucide-react"

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
    initialRequests: Request[]
    initialRevenue: number
    endTime: string
}

export function LiveDashboard({ eventId, eventName, venueName, initialRequests, initialRevenue }: LiveDashboardProps) {
    const [requests, setRequests] = useState<Request[]>(initialRequests)
    const [revenue, setRevenue] = useState(initialRevenue)
    const [soundEnabled, setSoundEnabled] = useState(true)

    useEffect(() => {
        const supabase = getSupabase()

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
                        
                        if (soundEnabled) playNotificationSound()
                        
                        toast.success(`New Request: ${newRequest.song_title}`, {
                            description: `${newRequest.requester_name || 'Anonymous'} paid $${newRequest.amount_paid}`
                        })
                    } else if (payload.eventType === 'UPDATE') {
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
        audio.play().catch(e => console.log('Audio play failed', e)); 
    }

    const sortQueue = (reqs: Request[]) => {
        return [...reqs].sort((a, b) => {
            // Priority Sort
            if (a.has_guaranteed_next && !b.has_guaranteed_next) return -1
            if (!a.has_guaranteed_next && b.has_guaranteed_next) return 1
            if (a.has_priority && !b.has_priority) return -1
            if (!a.has_priority && b.has_priority) return 1
            // Date Sort (Oldest first)
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
    }

    const handleStatusChange = async (id: string, newStatus: 'playing' | 'played') => {
        const supabase = getSupabase()
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))

        const { error } = await supabase
            .from('requests')
            .update({ status: newStatus })
            .eq('id', id)
        
        if (error) {
            toast.error("Failed to update status")
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
    }

    // Filter Lists
    const pendingRequests = sortQueue(requests.filter(r => r.status === 'pending'))
    const playingRequest = requests.find(r => r.status === 'playing')
    const playedRequests = requests.filter(r => r.status === 'played').sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-6 space-y-8">
            {/* Header / Stats */}
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
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className="hover:bg-gray-800 p-2 rounded-full transition-colors">
                        {soundEnabled ? <Bell className="h-5 w-5 text-yellow-400" /> : <BellOff className="h-5 w-5 text-gray-500" />}
                    </button>
                </div>
            </div>

            {/* LIVE FEED - No Tabs */}
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* 1. NOW PLAYING */}
                {playingRequest && (
                    <div className="space-y-2">
                         <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/> Now Playing
                        </h2>
                         <RequestCard 
                            request={playingRequest} 
                            onCopy={() => copyToClipboard(`${playingRequest.song_artist} - ${playingRequest.song_title}`)}
                            onPlay={() => {}} 
                            onDone={() => handleStatusChange(playingRequest.id, 'played')}
                        />
                    </div>
                )}

                {/* 2. INCOMING QUEUE */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Incoming Requests <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full">{pendingRequests.length}</span>
                        </h2>
                    </div>

                    <div className="grid gap-3">
                        <AnimatePresence mode="popLayout">
                            {pendingRequests.length === 0 && !playingRequest ? (
                                <div className="text-center py-20 text-gray-500 border border-dashed border-gray-800 rounded-xl">
                                    <Music className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>No requests yet. Share the QR code!</p>
                                </div>
                            ) : (
                                pendingRequests.map(req => (
                                    <RequestCard 
                                        key={req.id} 
                                        request={req} 
                                        onCopy={() => copyToClipboard(`${req.song_artist} - ${req.song_title}`)}
                                        onPlay={() => handleStatusChange(req.id, 'playing')}
                                        onDone={() => handleStatusChange(req.id, 'played')}
                                    />
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* 3. RECENTLY PLAYED (Small List) */}
                {playedRequests.length > 0 && (
                     <div className="space-y-4 pt-8 border-t border-gray-900">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Recently Played</h2>
                        <div className="opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            {playedRequests.slice(0, 5).map(req => (
                                <div key={req.id} className="flex items-center justify-between py-2 border-b border-gray-900 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <div className="text-sm">
                                            <span className="text-white font-medium">{req.song_title}</span>
                                            <span className="text-gray-500 mx-2">-</span>
                                            <span className="text-gray-400">{req.song_artist}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-600 font-mono">${req.amount_paid}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
                relative rounded-xl overflow-hidden border transition-all duration-300
                ${isPlaying 
                    ? 'bg-gradient-to-r from-green-900/30 to-black border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.15)] transform scale-[1.02]' 
                    : isPriority 
                        ? 'bg-gradient-to-r from-amber-900/20 to-black border-amber-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                }
            `}
        >
             {request.has_guaranteed_next && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10 shadow-lg">
                    CROWN REQUEST
                </div>
            )}

            <div className="flex p-4 gap-4">
                 {/* Art */}
                <div className="relative w-16 h-16 shrink-0 rounded bg-gray-800 shadow-inner overflow-hidden">
                    {request.song_artwork_url ? (
                        <img src={request.song_artwork_url} className="w-full h-full object-cover" />
                    ) : (
                        <Music className="w-full h-full p-4 text-gray-600" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-white text-lg leading-tight truncate pr-4">{request.song_title}</h3>
                            <p className="text-purple-400 text-sm truncate">{request.song_artist}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <div className={`text-xl font-bold font-mono tracking-tight ${request.amount_paid >= 10 ? 'text-green-400' : 'text-gray-300'}`}>
                                ${request.amount_paid}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-gray-600 rounded-full"/> {request.requester_name || 'Anonymous'}</span>
                        {request.has_shoutout && <span className="text-cyan-400 flex items-center gap-1 font-bold"><Mic2 className="w-3 h-3"/> Shoutout</span>}
                        {request.has_priority && <span className="text-amber-400 flex items-center gap-1 font-bold"><Zap className="w-3 h-3"/> Priority</span>}
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            {!isPlaying && (
                <div className="flex divide-x divide-white/5 border-t border-white/5 bg-black/20">
                     <button onClick={onCopy} className="flex-1 py-3 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                        <Copy className="w-3 h-3" /> Copy
                     </button>
                     <button onClick={onPlay} className="flex-1 py-3 hover:bg-green-500/20 text-green-500/70 hover:text-green-400 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                        <Play className="w-3 h-3 fill-current" /> Play Now
                     </button>
                </div>
            )}
             {isPlaying && (
                <div className="flex divide-x divide-white/5 border-t border-white/5 bg-green-500/10">
                     <div className="flex-1 py-3 text-green-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 animate-pulse">
                        Now Playing...
                     </div>
                     <button onClick={onDone} className="flex-1 py-3 hover:bg-green-500/20 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                        <CheckCircle className="w-3 h-3" /> Finish
                     </button>
                </div>
            )}
        </motion.div>
    )
}
