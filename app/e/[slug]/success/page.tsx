"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import confetti from "canvas-confetti"
import { CheckCircle, Music, Star, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import Image from "next/image"

export const dynamic = "force-dynamic";

export default function SuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("")

  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const songTitle = searchParams.get("song")
  const songArtist = searchParams.get("artist")

  useEffect(() => {
    // Fire confetti on mount
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleShare = async () => {
    const text = songTitle
      ? `I just requested ${songTitle} by ${songArtist}! \uD83C\uDFA7 Request yours here:`
      : `I just requested a song! \uD83C\uDFA7 Request yours here:`;

    // Construct the event URL (remove /success)
    const shareUrl = window.location.href.split("/success")[0];

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Nostalgic Requests",
          text: text,
          url: shareUrl,
        });
      } catch (error) {
        // User aborted or error
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(`${text} ${shareUrl}`);
      toast.success("Link copied to clipboard!")
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-8 bg-gradient-to-b from-[#1a0b2e] to-black text-white">
      <div className="space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-20 w-20 text-green-500 animate-bounce" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">Request Sent!</h1>
        <p className="text-xl text-gray-400">The DJ has received your request.</p>
      </div>

      <Card className="w-full max-w-sm border border-purple-500/30 bg-white/5 backdrop-blur-md">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3 justify-center text-lg font-medium text-white">
            <Music className="h-5 w-5 text-purple-400" />
            Estimated Wait: 15-20 mins
          </div>
          <p className="text-sm text-gray-400">
            You'll be notified when your song is about to play.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4 w-full max-w-sm">
        <Button size="lg" className="w-full font-bold bg-white text-black hover:bg-gray-200" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" /> Share to Story / Socials
        </Button>
        <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white">
          <Link href={`/e/${slug}`}>
            Request Another Song
          </Link>
        </Button>

        {/* Branding - Clickable to Homepage */}
        <Link href="/" className="mt-12 flex items-center justify-center gap-2 text-gray-500 text-xs hover:text-gray-300 transition-colors group">
          <span>Powered by</span>
          <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
            <div className="w-4 h-4 rounded overflow-hidden">
              <Image src="/logo.png" alt="Logo" width={16} height={16} className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold text-white">Nostalgic</span>
          </div>
        </Link>

      </div>
    </div>
  )
}
