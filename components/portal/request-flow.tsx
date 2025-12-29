"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Plus, Minus, Check, ChevronRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SongSearch } from "./song-search"
import { Track } from "@/lib/itunes"
import { PRICING, OrderDetails, calculateTotal, formatPrice } from "@/lib/pricing"
import { toast } from "sonner"
import Image from "next/image"

interface RequestFlowProps {
  eventId: string
  eventSlug: string
  basePrice?: number
}

type Step = "search" | "packages" | "upsells" | "info" | "checkout"

export function RequestFlow({ eventId, eventSlug }: RequestFlowProps) {
  const [step, setStep] = useState<Step>("search")
  const [loading, setLoading] = useState(false)
  const [songs, setSongs] = useState<Track[]>([])
  const [packageType, setPackageType] = useState<keyof typeof PRICING.packages>("single")
  const [addons, setAddons] = useState({
    priority: false,
    shoutout: false,
    guaranteedNext: false,
  })
  const [requesterInfo, setRequesterInfo] = useState({
    name: "",
    phone: "",
    email: "",
  })

  const currentTotal = calculateTotal({
    package: packageType,
    addons,
  })

  // Handlers
  const handleSelectSong = (track: Track) => {
    const newSongs = [...songs, track]
    setSongs(newSongs)
    
    // Auto-advance logic
    if (newSongs.length === 1) {
      setStep("packages")
    } else {
        // If they are adding 2nd or 3rd song, check if package limit reached
        const limit = PRICING.packages[packageType].songs
        if (newSongs.length >= limit) {
             setStep("packages") // Go back to review/package screen
        } else {
            // Stay on search? Or go back to package screen to show progress?
            // Let's go back to package screen to show "2/3 selected"
            setStep("packages")
        }
    }
  }

  const handleRemoveSong = (index: number) => {
    const newSongs = [...songs]
    newSongs.splice(index, 1)
    setSongs(newSongs)
    if (newSongs.length === 0) setStep("search")
  }

  const handleAddMoreSongs = () => {
    setStep("search")
  }

  const handlePackageChange = (type: keyof typeof PRICING.packages) => {
    setPackageType(type)
    // If they downgrade and have too many songs, warn or trim?
    // User might just selecting to see price. We can trim on checkout or visually indicator.
    // For MVP, just let them have more songs selected but maybe error/warn on continue?
    // Actually, good UX is to keep them but maybe just charge extra? 
    // The prompt implies strict packages: Single(1), Double(2), Party(3).
    // Let's strictly enforce usage: If they pick double, they need 2 songs.
  }

  const handleCheckout = async () => {
    if (!requesterInfo.phone) {
      toast.error("Phone number is required")
      return
    }
    if (addons.shoutout && !requesterInfo.name) {
        toast.error("Name is required for a Shoutout")
        return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          eventSlug,
          songs: songs.slice(0, PRICING.packages[packageType].songs), // Safety trim
          package: packageType,
          addons,
          requesterName: requesterInfo.name,
          requesterPhone: requesterInfo.phone,
          requesterEmail: requesterInfo.email,
        }),
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL")
      }
    } catch (error) {
      console.error(error)
      toast.error("Checkout failed. Please try again.")
      setLoading(false)
    }
  }

  // Render Steps
  return (
    <div className="flex flex-col h-full max-w-lg mx-auto w-full relative">
        <AnimatePresence mode="wait">
            {step === "search" && (
                <motion.div 
                    key="search"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full"
                >
                    <div className="flex items-center mb-4">
                        {songs.length > 0 && (
                             <Button variant="ghost" size="icon" onClick={() => setStep("packages")} className="mr-2">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <h2 className="text-xl font-bold">
                            {songs.length > 0 ? `Select Song #${songs.length + 1}` : "Find a Song"}
                        </h2>
                    </div>
                    <SongSearch onSelect={handleSelectSong} />
                </motion.div>
            )}

            {step === "packages" && (
                <motion.div 
                    key="packages"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 pb-24"
                >
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Review Selections</h2>
                        
                        {/* Selected Songs List */}
                        <div className="space-y-2">
                            {songs.slice(0, PRICING.packages[packageType].songs).map((song, i) => (
                                <Card key={song.id + i} className="relative overflow-hidden">
                                     <CardContent className="p-3 flex items-center gap-3">
                                        <div className="h-12 w-12 relative bg-secondary rounded overflow-hidden">
                                            <Image src={song.artworkUrl} alt={song.title} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{song.title}</div>
                                            <div className="text-xs text-muted-foreground truncate">{song.artist}</div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleRemoveSong(i)}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                     </CardContent>
                                </Card>
                            ))}
                            {songs.length < PRICING.packages[packageType].songs && (
                                <Button variant="outline" className="w-full h-16 border-dashed" onClick={handleAddMoreSongs}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Another Song
                                </Button>
                            )}
                        </div>

                        {/* Package Selection */}
                        <div className="grid gap-3 pt-4">
                            <Label className="text-base">Select Package</Label>
                            {Object.entries(PRICING.packages).map(([key, pkg]) => {
                                const isSelected = packageType === key
                                return (
                                    <div 
                                        key={key}
                                        className={`
                                            relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                                            ${isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}
                                        `}
                                        onClick={() => handlePackageChange(key as any)}
                                    >
                                        <div className="space-y-1">
                                            <div className="font-bold">{pkg.label}</div>
                                            <div className="text-xs text-muted-foreground">{pkg.songs} song{pkg.songs > 1 ? "s" : ""} included</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg">{formatPrice(pkg.price)}</div>
                                            {pkg.savings > 0 && <div className="text-xs text-green-500 font-medium">Save ${pkg.savings}</div>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </motion.div>
            )}

            {step === "upsells" && (
                <motion.div 
                    key="upsells"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 pb-24"
                >
                     <div className="flex items-center mb-4">
                        <Button variant="ghost" size="icon" onClick={() => setStep("packages")} className="mr-2">
                             <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-xl font-bold">Make it Special</h2>
                    </div>

                    <div className="grid gap-4">
                        <div 
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${addons.priority ? "border-orange-500 bg-orange-500/10" : "border-border bg-card"}`}
                            onClick={() => setAddons(p => ({...p, priority: !p.priority}))}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold flex items-center gap-2">? Priority Play</h3>
                                <span className="font-bold">{formatPrice(PRICING.addons.priority.price)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">Skip the line - your song plays before regular requests.</p>
                            <div className="mt-3 flex justify-end">
                                <Button size="sm" variant={addons.priority ? "default" : "secondary"}>
                                    {addons.priority ? "Added" : "Add Priority"}
                                </Button>
                            </div>
                        </div>

                        <div 
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${addons.shoutout ? "border-pink-500 bg-pink-500/10" : "border-border bg-card"}`}
                            onClick={() => setAddons(p => ({...p, shoutout: !p.shoutout}))}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold flex items-center gap-2">?? Shoutout</h3>
                                <span className="font-bold">{formatPrice(PRICING.addons.shoutout.price)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">Get a personal dedication from the DJ before your song.</p>
                             <div className="mt-3 flex justify-end">
                                <Button size="sm" variant={addons.shoutout ? "default" : "secondary"}>
                                    {addons.shoutout ? "Added" : "Add Shoutout"}
                                </Button>
                            </div>
                        </div>

                        <div 
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${addons.guaranteedNext ? "border-red-600 bg-red-600/10" : "border-border bg-card"}`}
                            onClick={() => setAddons(p => ({...p, guaranteedNext: !p.guaranteedNext}))}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold flex items-center gap-2 text-red-500">?? Guaranteed Next</h3>
                                <span className="font-bold">{formatPrice(PRICING.addons.guaranteedNext.price)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">The ultimate VIP treatment. Your song plays IMMEDIATELY.</p>
                             <div className="mt-3 flex justify-end">
                                <Button size="sm" variant={addons.guaranteedNext ? "destructive" : "secondary"}>
                                    {addons.guaranteedNext ? "Added" : "Add VIP"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {step === "info" && (
                <motion.div 
                    key="info"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                     className="space-y-6 pb-24"
                >
                     <div className="flex items-center mb-4">
                        <Button variant="ghost" size="icon" onClick={() => setStep("upsells")} className="mr-2">
                             <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-xl font-bold">Final Details</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Mobile Number <span className="text-destructive">*</span></Label>
                            <Input 
                                type="tel" 
                                placeholder="(555) 123-4567"
                                value={requesterInfo.phone} 
                                onChange={e => setRequesterInfo(p => ({...p, phone: e.target.value}))}
                                className="h-12 text-lg"
                            />
                            <p className="text-xs text-muted-foreground">We''ll text you when your song is up next!</p>
                        </div>

                         <div className="space-y-2">
                            <Label>Your Name {addons.shoutout && <span className="text-destructive">*</span>}</Label>
                            <Input 
                                placeholder="DJ Cool"
                                value={requesterInfo.name} 
                                onChange={e => setRequesterInfo(p => ({...p, name: e.target.value}))}
                                className="h-12"
                            />
                            {addons.shoutout && <p className="text-xs text-primary">Required for shoutout deduction.</p>}
                        </div>

                         <div className="space-y-2">
                            <Label>Email (Optional)</Label>
                            <Input 
                                type="email" 
                                placeholder="hello@example.com"
                                value={requesterInfo.email} 
                                onChange={e => setRequesterInfo(p => ({...p, email: e.target.value}))}
                                className="h-12"
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Footer Actions */}
        {step !== "search" && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50 safely-bottom">
                 <div className="max-w-lg mx-auto flex items-center gap-4">
                    <div className="flex-1">
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total</div>
                        <div className="text-2xl font-bold">{formatPrice(currentTotal)}</div>
                    </div>
                    {step === "packages" && (
                         <Button 
                            size="lg" 
                            className="w-40 font-bold" 
                            onClick={() => {
                                // Validate song count
                                const required = PRICING.packages[packageType].songs;
                                if (songs.length < required) {
                                    toast.error(`Please select ${required - songs.length} more song(s) for this package.`);
                                    return;
                                }
                                setStep("upsells");
                            }}
                        >
                            Continue <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                    {step === "upsells" && (
                         <Button size="lg" className="w-40 font-bold" onClick={() => setStep("info")}>
                            Continue <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                    {step === "info" && (
                         <Button 
                            size="lg" 
                            className="w-40 font-bold bg-green-600 hover:bg-green-700" 
                            onClick={handleCheckout}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Pay Now"}
                        </Button>
                    )}
                 </div>
            </div>
        )}
    </div>
  )
}
