"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import confetti from "canvas-confetti"
import { CheckCircle, Music, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = 'force-dynamic';

export default function SuccessPage({ params }: { params: Promise<{ slug: string }> }) {
 const [slug, setSlug] = useState<string>("")
 
 useEffect(() => {
     params.then(p => setSlug(p.slug))
 }, [params])

  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  useEffect(() => {
    // Fire confetti on mount
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-8">
      <div className="space-y-4">
        <div className="flex justify-center">
            <CheckCircle className="h-20 w-20 text-green-500" />
        </div>
        <h1 className="text-4xl font-bold">Request Sent! ??</h1>
        <p className="text-xl text-muted-foreground">The DJ currently has your request.</p>
      </div>

      <Card className="w-full max-w-sm border-2 border-primary/20 bg-secondary/10">
        <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 justify-center text-lg font-medium">
                <Music className="h-5 w-5 text-primary" />
                Estimated Wait: 15-20 mins
            </div>
            <p className="text-sm text-muted-foreground">
                We''ll send a text to your phone when your song is about to play!
            </p>
        </CardContent>
      </Card>
      
      <div className="space-y-4 w-full max-w-sm">
        <Button asChild size="lg" className="w-full font-bold">
            <Link href={`/e/${slug}`}>
                Request Another Song
            </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
             <Link href="https://instagram.com" target="_blank">
                Share to Instagram Stories
            </Link>
        </Button>
      </div>
    </div>
  )
}
