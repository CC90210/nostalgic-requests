"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Plus, Minus, Check, ChevronRight, ArrowLeft,
  Music, Sparkles, Zap, Mic2, Star, Disc, CreditCard, Phone, User, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SongSearch } from "./song-search";
import { Track } from "@/lib/itunes";
import { PRICING, calculateTotal, formatPrice } from "@/lib/pricing";
import { toast } from "sonner";
import Image from "next/image";

interface RequestFlowProps {
  eventId: string;
  eventSlug: string;
  basePrice?: number;
}

type Step = "search" | "packages" | "upsells" | "info";

export function RequestFlow({ eventId, eventSlug }: RequestFlowProps) {
  const [step, setStep] = useState<Step>("search");
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<Track[]>([]);
  const [packageType, setPackageType] = useState<keyof typeof PRICING.packages>("single");
  const [addons, setAddons] = useState({
    priority: false,
    shoutout: false,
    guaranteedNext: false,
  });
  const [requesterInfo, setRequesterInfo] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const currentTotal = calculateTotal({ package: packageType, addons });

  // --- Handlers ---

  const handleSelectSong = (track: Track) => {
    const newSongs = [...songs, track];
    setSongs(newSongs);
    
    // Smart Navigation
    // If first song, go to packages to upsell immediately
    if (newSongs.length === 1) {
      setStep("packages");
    } else {
        // Check if package limit reached
        const limit = PRICING.packages[packageType].songs;
        if (newSongs.length >= limit) {
             setStep("packages");
        } else {
            setStep("packages"); // Always confirm selection
        }
    }
  };

  const handleRemoveSong = (index: number) => {
    const newSongs = [...songs];
    newSongs.splice(index, 1);
    setSongs(newSongs);
    if (newSongs.length === 0) setStep("search");
  };

  const handleCheckout = async () => {
    if (!requesterInfo.phone) {
      toast.error("Mobile number is required for updates");
      return;
    }
    if (addons.shoutout && !requesterInfo.name) {
        toast.error("Name is required for a Shoutout");
        return;
    }

    setLoading(true);
    const payload = {
      eventId,
      eventSlug,
      songs: songs.slice(0, PRICING.packages[packageType].songs),
      package: packageType,
      addons,
      requesterName: requesterInfo.name,
      requesterPhone: requesterInfo.phone,
      requesterEmail: requesterInfo.email,
    };

    console.log("[Client Checkout] Sending Payload:", payload);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Server rejected checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("[Client Checkout Error]:", error);
      toast.error(`Checkout Failed: ${error.message}`);
      setLoading(false);
    }
  };

  // --- UI Components ---

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto w-full relative min-h-[80vh]">
        <AnimatePresence mode="wait">
            
            {/* STEP 1: SONG SEARCH */}
            {step === "search" && (
                <motion.div 
                    key="search"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full space-y-4"
                >
                    <div className="flex items-center justify-between mb-2">
                         <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text flex items-center gap-2">
                            <Music className="w-6 h-6 text-purple-400" />
                            {songs.length > 0 ? "Add Another Track" : "Find Your Jam"}
                        </h2>
                        {songs.length > 0 && (
                             <Button variant="ghost" className="text-gray-400" onClick={() => setStep("packages")}>Cancel</Button>
                        )}
                    </div>
                    <SongSearch onSelect={handleSelectSong} />
                </motion.div>
            )}

            {/* STEP 2: PACKAGES */}
            {step === "packages" && (
                <motion.div 
                    key="packages"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 pb-32"
                >
                    {/* Header */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Your Selection</h2>
                        <p className="text-sm text-gray-400">Review your songs and choose a package.</p>
                    </div>
                    
                    {/* Selected Songs (Vinyl Style) */}
                    <div className="space-y-3">
                        {songs.slice(0, PRICING.packages[packageType].songs).map((song, i) => (
                            <div key={song.id + i} className="relative group">
                                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full opacity-50"></div>
                                <div className="relative bg-[#1A1A1B] border border-[#2D2D2D] rounded-xl p-3 flex items-center gap-4 hover:border-purple-500/50 transition-colors">
                                    <div className="h-14 w-14 relative rounded-md overflow-hidden shadow-lg shrink-0">
                                        <Image src={song.artworkUrl} alt={song.title} fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/20 ring-1 ring-white/10"></div>
                                        {/* Vinyl groove effect */}
                                        <div className="absolute inset-0 rounded-full border-2 border-white/5 m-1"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-white truncate text-lg leading-tight">{song.title}</div>
                                        <div className="text-sm text-purple-400 truncate">{song.artist}</div>
                                    </div>
                                    <Button size="icon" variant="ghost" className="text-gray-500 hover:text-red-500 hover:bg-red-500/10" onClick={() => handleRemoveSong(i)}>
                                        <Minus className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {songs.length < PRICING.packages[packageType].songs && (
                            <Button variant="outline" className="w-full h-16 border-dashed border-gray-700 hover:border-purple-500 hover:text-purple-400 hover:bg-purple-500/5 transition-all text-gray-400" onClick={() => setStep("search")}>
                                <Plus className="mr-2 h-5 w-5" /> Add Another Song
                            </Button>
                        )}
                    </div>

                    {/* Packages */}
                    <div className="grid gap-3 pt-2">
                        <Label className="text-gray-400 uppercase text-xs font-bold tracking-widest">Select Package</Label>
                        {Object.entries(PRICING.packages).map(([key, pkg]) => {
                            const isSelected = packageType === key;
                            return (
                                <div 
                                    key={key}
                                    className={`
                                        relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                                        ${isSelected 
                                            ? "border-purple-500 bg-gradient-to-r from-purple-900/40 to-black shadow-[0_0_20px_rgba(168,85,247,0.2)]" 
                                            : "border-[#2D2D2D] bg-[#111] hover:border-gray-600"
                                        }
                                    `}
                                    onClick={() => setPackageType(key as any)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-6 h-6 rounded-full flex items-center justify-center border
                                            ${isSelected ? "bg-purple-500 border-purple-500" : "border-gray-600"}
                                        `}>
                                            {isSelected && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                        <div>
                                            <div className={`font-bold text-lg ${isSelected ? "text-white" : "text-gray-300"}`}>{pkg.label}</div>
                                            <div className="text-xs text-gray-500">{pkg.songs} song{pkg.songs > 1 ? "s" : ""} included</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold text-xl ${isSelected ? "text-purple-400" : "text-gray-400"}`}>{formatPrice(pkg.price)}</div>
                                        {pkg.savings > 0 && <div className="text-[10px] text-green-400 font-bold bg-green-900/30 px-2 py-0.5 rounded-full">SAVE ${pkg.savings}</div>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            )}

            {/* STEP 3: UPSELLS */}
            {step === "upsells" && (
                <motion.div 
                    key="upsells"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 pb-32"
                >
                     <div className="flex items-center mb-4 gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setStep("packages")} className="text-gray-400 hover:text-white">
                             <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="text-yellow-400 w-6 h-6" /> Make it Special
                        </h2>
                    </div>

                    <div className="grid gap-4">
                        {/* Priority */}
                        <div 
                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${addons.priority ? "border-orange-500 bg-orange-900/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]" : "border-[#2D2D2D] bg-[#111]"}`}
                            onClick={() => setAddons(p => ({...p, priority: !p.priority}))}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Zap className={`w-5 h-5 ${addons.priority ? "text-orange-500 fill-orange-500" : "text-gray-500"}`} /> 
                                    Priority Play
                                </h3>
                                <span className="font-bold text-orange-400 text-lg">{formatPrice(PRICING.addons.priority.price)}</span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">Skip the queue. Your song plays before standard requests.</p>
                        </div>

                        {/* Shoutout */}
                        <div 
                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${addons.shoutout ? "border-blue-500 bg-blue-900/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "border-[#2D2D2D] bg-[#111]"}`}
                            onClick={() => setAddons(p => ({...p, shoutout: !p.shoutout}))}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Mic2 className={`w-5 h-5 ${addons.shoutout ? "text-blue-500 fill-blue-500" : "text-gray-500"}`} /> 
                                    Shoutout
                                </h3>
                                <span className="font-bold text-blue-400 text-lg">{formatPrice(PRICING.addons.shoutout.price)}</span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">The DJ will dedicate this song to you (or a friend) on the mic.</p>
                        </div>

                        {/* Guaranteed Next */}
                        <div 
                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${addons.guaranteedNext ? "border-red-600 bg-red-900/20 shadow-[0_0_20px_rgba(220,38,38,0.3)]" : "border-[#2D2D2D] bg-[#111]"}`}
                            onClick={() => setAddons(p => ({...p, guaranteedNext: !p.guaranteedNext}))}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Star className={`w-5 h-5 ${addons.guaranteedNext ? "text-red-500 fill-red-500" : "text-gray-500"}`} /> 
                                    Guaranteed Next
                                </h3>
                                <span className="font-bold text-red-500 text-lg">{formatPrice(PRICING.addons.guaranteedNext.price)}</span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">VIP Status. Your song plays IMMEDIATELY after the current track.</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* STEP 4: INFO */}
            {step === "info" && (
                <motion.div 
                    key="info"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                     className="space-y-6 pb-32"
                >
                     <div className="flex items-center mb-6 gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setStep("upsells")} className="text-gray-400 hover:text-white">
                             <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h2 className="text-2xl font-bold text-white">Final Details</h2>
                    </div>

                    <div className="space-y-6 bg-[#1A1A1B] p-6 rounded-2xl border border-[#2D2D2D]">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Mobile Number <span className="text-purple-500">*</span></Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <Input 
                                    type="tel" 
                                    placeholder="(555) 123-4567"
                                    value={requesterInfo.phone} 
                                    onChange={e => setRequesterInfo(p => ({...p, phone: e.target.value}))}
                                    className="pl-10 h-14 bg-black border-[#2D2D2D] focus:border-purple-500 focus:ring-purple-500/20 text-lg"
                                />
                            </div>
                            <p className="text-xs text-gray-500">We''ll text you when your song is playing!</p>
                        </div>

                         <div className="space-y-2">
                            <Label className="text-gray-300">Your Name {addons.shoutout && <span className="text-purple-500">*</span>}</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <Input 
                                    placeholder="DJ Cool"
                                    value={requesterInfo.name} 
                                    onChange={e => setRequesterInfo(p => ({...p, name: e.target.value}))}
                                    className="pl-10 h-14 bg-black border-[#2D2D2D] focus:border-purple-500 focus:ring-purple-500/20"
                                />
                            </div>
                        </div>

                         <div className="space-y-2">
                            <Label className="text-gray-300">Email (Receipts)</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <Input 
                                    type="email" 
                                    placeholder="hello@example.com"
                                    value={requesterInfo.email} 
                                    onChange={e => setRequesterInfo(p => ({...p, email: e.target.value}))}
                                    className="pl-10 h-14 bg-black border-[#2D2D2D] focus:border-purple-500 focus:ring-purple-500/20"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- STICKY FOOTER --- */}
        {step !== "search" && (
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-[#2D2D2D] bg-[#0A0A0B]/90 backdrop-blur-lg z-50 safe-area-bottom">
                 <div className="max-w-lg mx-auto flex items-center gap-4">
                    <div className="flex-1">
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total</div>
                        <div className="text-3xl font-bold text-white tracking-tight">{formatPrice(currentTotal)}</div>
                    </div>
                    
                    {step === "packages" && (
                         <Button 
                            size="lg" 
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 h-14 rounded-full shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all hover:scale-105"
                            onClick={() => {
                                const required = PRICING.packages[packageType].songs;
                                if (songs.length < required) {
                                    toast.error(`Please select ${required - songs.length} more song(s).`);
                                    return;
                                }
                                setStep("upsells");
                            }}
                        >
                            Continuar <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    )}
                    
                    {step === "upsells" && (
                         <Button 
                            size="lg" 
                            className="bg-white text-black hover:bg-gray-200 font-bold px-8 h-14 rounded-full transition-all hover:scale-105"
                            onClick={() => setStep("info")}
                        >
                            Checkout <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    )}
                    
                    {step === "info" && (
                         <Button 
                            size="lg" 
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-8 h-14 rounded-full shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all w-48 relative overflow-hidden"
                            onClick={handleCheckout}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin w-6 h-6" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Pay Now <CreditCard className="w-5 h-5" />
                                </span>
                            )}
                        </Button>
                    )}
                 </div>
            </div>
        )}
    </div>
  )
}
