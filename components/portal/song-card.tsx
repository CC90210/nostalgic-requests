import Image from "next/image"
import { Play, Pause } from "lucide-react"
import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Track, formatDuration } from "@/lib/itunes"

interface SongCardProps {
  track: Track
  onSelect: (track: Track) => void
  disabled?: boolean
}

export function SongCard({ track, onSelect, disabled }: SongCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const togglePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!audioRef.current) {
      audioRef.current = new Audio(track.previewUrl)
      audioRef.current.onended = () => setIsPlaying(false)
    }

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      // Stop other audios if global state needed (omitted for MVP)
      audioRef.current.play().catch(e => console.error("Audio play failed", e))
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer hover:bg-accent transition-colors border-border/40", 
        disabled && "opacity-50 pointer-events-none"
      )}
      onClick={() => onSelect(track)}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div className="relative h-14 w-14 flex-shrink-0 bg-secondary rounded-md overflow-hidden group">
          <Image 
            src={track.artworkUrl} 
            alt={track.album} 
            fill 
            className="object-cover"
          />
          {track.previewUrl && (
            <div 
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={togglePreview}
            >
                {isPlaying ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white" />}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate text-sm md:text-base leading-tight">
            {track.title}
          </h4>
          <p className="text-sm text-muted-foreground truncate">
            {track.artist}
          </p>
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {formatDuration(track.duration)}
        </div>
      </CardContent>
    </Card>
  )
}
