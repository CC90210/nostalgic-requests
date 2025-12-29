"use client"

import { useState, useEffect } from "react"
import { useDebounce } from "use-debounce"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SongCard } from "./song-card"
import { Track } from "@/lib/itunes"
import { toast } from "sonner"

interface SongSearchProps {
  onSelect: (track: Track) => void
  disabled?: boolean
}

export function SongSearch({ onSelect, disabled }: SongSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [debouncedQuery] = useDebounce(query, 300)

  useEffect(() => {
    async function search() {
      if (!debouncedQuery.trim()) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(debouncedQuery)}`)
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setResults(data.tracks || [])
      } catch (error) {
        console.error(error)
        toast.error("Failed to search songs")
      } finally {
        setLoading(false)
      }
    }

    search()
  }, [debouncedQuery])

  return (
    <div className="space-y-4 w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for any song..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-12 text-lg bg-secondary/50 border-transparent focus:border-primary"
          disabled={disabled}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-300px)] min-h-[300px]">
        {results.length > 0 ? (
          <div className="space-y-2 pb-20">
            {results.map((track) => (
              <SongCard 
                key={track.id} 
                track={track} 
                onSelect={onSelect}
                disabled={disabled}
              />
            ))}
          </div>
        ) : query.trim() ? (
          <div className="text-center py-12 text-muted-foreground">
            {loading ? "Searching..." : "No songs found"}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-2">??</p>
            Start typing to find a song
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
