"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Plus, Minus, Check, ChevronRight, ArrowLeft,
  Music, Sparkles, Zap, Mic2, Crown, Disc, CreditCard, Phone, User, Mail
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
    if (newSongs.length === 1) {
      setStep("packages");
    } else {
        const limit = PRICING.packages[packageType].songs;
        if (newSongs.length >= limit) setStep("packages");
        else setStep("packages");
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
      alert(`Payment Error: ${error.message}`); // Explicit Alert as requested
      setLoading(false);
    }
  };

  // --- UI Components ---

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto w-full relative min-h-[85vh] bg-gradient-to-b from-[#2e0239] via-[#120019] to-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 my-4">
        
        {/* Helper Header */}
        <div className="p-4 flex items-center justify-between bg-white/5 backdrop-blur-md border-b border-white/10">
            {step !== "search" && (
                <Button variant="ghost" size="icon" onClick={() => setStep(step === "info" ? "upsells" : step === "upsells" ? "packages" : "search")} className="text-gray-400 hover:text-white hover:bg-white/10">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            )}
             <div className="flex-1 text-center">
                <span className="text-xs font-bold tracking-widest text-purple-400 uppercase">
                    {step === "search" ? "Step 1/4" : step === "packages" ? "Step 2/4" : step === "upsells" ? "Step 3/4" : "Step 4/4"}
                </span>
            </div>
            <div className="w-10"></div>
        </div>

        <div className="p-6 overflow-y-auto pb-40 scrollbar-hide flex-1">
        <AnimatePresence mode="wait">
            
            {/* STEP 1: SONG SEARCH */}
            {step === "search" && (
                <motion.div 
                    key="search"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                    <div className="text-center space-y-2">
                         <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                            {songs.length > 0 ? "Add More Magic" : "Request a Track"}
                        </h2>
                        <p className="text-gray-400 text-sm">Find your song in our extensive library.</p>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-inner">
                        <SongSearch onSelect={handleSelectSong} />
                    </div>
                </motion.div>
            )}

            {/* STEP 2: PACKAGES */}
            {step === "packages" && (
                <motion.div 
                    key="packages"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                >
                    {/* Selected Songs */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                             <Disc className="w-5 h-5 text-purple-400" /> Your Mix
                        </h2>
                        <div className="space-y-3">
                            {songs.slice(0, PRICING.packages[packageType].songs).map((song, i) => (
                                <div key={song.id + i} className="group relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl opacity-30 blur group-hover:opacity-70 transition duration-500"></div>
                                    <div className="relative bg-[#1A1A1B] border border-white/10 rounded-xl p-3 flex items-center gap-4">
                                        <div className="h-14 w-14 relative rounded-md overflow-hidden shadow-lg shrink-0">
                                            <Image src={song.artworkUrl} alt={song.title} fill className="object-cover" />
                                            {/* Vinyl Shine */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-white truncate text-lg">{song.title}</div>
                                            <div className="text-sm text-purple-400 truncate">{song.artist}</div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="text-gray-500 hover:text-red-500" onClick={() => handleRemoveSong(i)}>
                                            <Minus className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {songs.length < PRICING.packages[packageType].songs && (
                                <Button variant="outline" className="w-full h-16 border-dashed border-white/20 text-gray-400 hover:border-purple-500 hover:text-purple-300 hover:bg-purple-500/10 transition-all rounded-xl" onClick={() => setStep("search")}>
                                    <Plus className="mr-2 h-5 w-5" /> Select Another Song
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Packages */}
                    <div className="space-y-4">
                        <Label className="text-gray-400 uppercase text-xs font-bold tracking-widest pl-1">Select Package</Label>
                        <div className="grid gap-4">
                            {Object.entries(PRICING.packages).map(([key, pkg]) => {
                                const isSelected = packageType === key;
                                return (
                                    <div 
                                        key={key}
                                        className={`
                                            relative flex items-center justify-between p-5 rounded-xl border border-white/10 cursor-pointer transition-all duration-300
                                            ${isSelected 
                                                ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.2)]" 
                                                : "bg-white/5 hover:bg-white/10"
                                            }
                                        `}
                                        onClick={() => setPackageType(key as any)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                w-6 h-6 rounded-full flex items-center justify-center border transition-colors
                                                ${isSelected ? "bg-purple-500 border-purple-500" : "border-gray-600 bg-transparent"}
                                            `}>
                                                {isSelected && <Check className="w-4 h-4 text-white" />}
                                            </div>
                                            <div>
                                                <div className={`font-bold text-lg ${isSelected ? "text-white" : "text-gray-300"}`}>{pkg.label}</div>
                                                <div className="text-xs text-gray-500">{pkg.songs} song{pkg.songs > 1 ? "s" : ""}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold text-xl ${isSelected ? "text-purple-300" : "text-gray-400"}`}>{formatPrice(pkg.price)}</div>
                                            {pkg.savings > 0 && <span className="text-[10px] text-black font-bold bg-green-400 px-2 py-0.5 rounded-full inline-block mt-1">SAVE ${pkg.savings}</span>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
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
                    className="space-y-6"
                >
                     <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                            <Sparkles className="text-amber-400 w-6 h-6 animate-pulse" /> Customize It
                        </h2>
                        <p className="text-gray-400 text-sm">Make your request stand out.</p>
                    </div>

                    <div className="grid gap-4">
                        {/* Priority - Amber */}
                        <div 
                            className={`p-5 rounded-xl border cursor-pointer transition-all ${addons.priority ? "border-amber-500/50 bg-amber-950/40" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                            onClick={() => setAddons(p => ({...p, priority: !p.priority}))}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Zap className={`w-5 h-5 ${addons.priority ? "text-amber-500 fill-amber-500" : "text-gray-500"}`} /> 
                                    Priority Play
                                </h3>
                                <span className="font-bold text-amber-500 text-lg">{formatPrice(PRICING.addons.priority.price)}</span>
                            </div>
                            <p className="text-sm text-gray-400">Jump the queue. Play sooner.</p>
                        </div>

                        {/* Shoutout - Cyan */}
                        <div 
                            className={`p-5 rounded-xl border cursor-pointer transition-all ${addons.shoutout ? "border-cyan-500/50 bg-cyan-950/40" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                            onClick={() => setAddons(p => ({...p, shoutout: !p.shoutout}))}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Mic2 className={`w-5 h-5 ${addons.shoutout ? "text-cyan-500 fill-cyan-500" : "text-gray-500"}`} /> 
                                    Shoutout
                                </h3>
                                <span className="font-bold text-cyan-500 text-lg">{formatPrice(PRICING.addons.shoutout.price)}</span>
                            </div>
                            <p className="text-sm text-gray-400">Personal dedication from the DJ.</p>
                        </div>

                        {/* Guaranteed Next - Red */}
                        <div 
                            className={`relative p-5 rounded-xl border cursor-pointer transition-all overflow-hidden ${addons.guaranteedNext ? "border-red-500/50 bg-red-950/40" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                            onClick={() => setAddons(p => ({...p, guaranteedNext: !p.guaranteedNext}))}
                        >
                            {addons.guaranteedNext && <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">POPULAR</div>}
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Crown className={`w-5 h-5 ${addons.guaranteedNext ? "text-red-500 fill-red-500" : "text-gray-500"}`} /> 
                                    Guaranteed Next
                                </h3>
                                <span className="font-bold text-red-500 text-lg">{formatPrice(PRICING.addons.guaranteedNext.price)}</span>
                            </div>
                            <p className="text-sm text-gray-400">Skip everyone. Play IMMEDIATELY.</p>
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
                     className="space-y-8"
                >
                     <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">Final Details</h2>
                        <p className="text-gray-400 text-sm">Where should we verify your request?</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-gray-300 ml-1">Mobile Number <span className="text-purple-500">*</span></Label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                                <Input 
                                    type="tel" 
                                    placeholder="(555) 123-4567"
                                    value={requesterInfo.phone} 
                                    onChange={e => setRequesterInfo(p => ({...p, phone: e.target.value}))}
                                    className="pl-12 h-14 bg-black/40 border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 rounded-lg text-white placeholder:text-gray-600 transition-all"
                                />
                            </div>
                        </div>

                         <div className="space-y-2">
                            <Label className="text-gray-300 ml-1">Your Name {addons.shoutout && <span className="text-purple-500">*</span>}</Label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                                <Input 
                                    placeholder="DJ Cool"
                                    value={requesterInfo.name} 
                                    onChange={e => setRequesterInfo(p => ({...p, name: e.target.value}))}
                                   className="pl-12 h-14 bg-black/40 border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 rounded-lg text-white placeholder:text-gray-600 transition-all"
                                />
                            </div>
                        </div>

                         <div className="space-y-2">
                            <Label className="text-gray-300 ml-1">Email (Optional)</Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                                <Input 
                                    type="email" 
                                    placeholder="hello@example.com"
                                    value={requesterInfo.email} 
                                    onChange={e => setRequesterInfo(p => ({...p, email: e.target.value}))}
                                    className="pl-12 h-14 bg-black/40 border-purple-500/30 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 rounded-lg text-white placeholder:text-gray-600 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        </div>

        {/* --- STICKY FOOTER --- */}
        {step !== "search" && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/80 backdrop-blur-xl z-50">
                 <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total</div>
                        <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-1">
                            {formatPrice(currentTotal)}
                            <span className="text-xs text-gray-500 font-normal">USD</span>
                        </div>
                    </div>
                    
                    {step === "packages" && (
                         <Button 
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold h-14 px-8 rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02] active:scale-95"
                            onClick={() => {
                                const required = PRICING.packages[packageType].songs;
                                if (songs.length < required) {
                                    toast.error(`Please select ${required - songs.length} more song(s).`);
                                    return;
                                }
                                setStep("upsells");
                            }}
                        >
                            Next Step <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    )}
                    
                    {step === "upsells" && (
                         <Button 
                            className="bg-white text-black hover:bg-gray-200 font-bold h-14 px-8 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95"
                            onClick={() => setStep("info")}
                        >
                            Checkout <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    )}
                    
                    {step === "info" && (
                         <Button 
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold w-48 h-14 rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
                            onClick={handleCheckout}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin w-6 h-6" />
                            ) : (
                                <span className="flex items-center gap-2 text-lg">
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
