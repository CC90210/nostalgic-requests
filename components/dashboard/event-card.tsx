import Link from "next/link"
import { format } from "date-fns"
import { CalendarDays, MapPin, QrCode, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface EventCardProps {
  event: {
    id: string
    name: string
    venue_name: string
    start_time: string
    status: string
    request_count?: number
    revenue?: number
  }
}

export function EventCard({ event }: EventCardProps) {
  const isLive = event.status === "live"

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <Badge variant={isLive ? "default" : "secondary"} className="mb-2">
            {isLive ? "LIVE NOW" : event.status.toUpperCase()}
          </Badge>
          {event.revenue !== undefined && (
            <span className="text-green-500 font-bold">${event.revenue.toFixed(2)}</span>
          )}
        </div>
        <CardTitle className="line-clamp-1">{event.name}</CardTitle>
        <CardDescription className="flex items-center mt-1">
          <MapPin className="mr-1 h-3 w-3" />
          {event.venue_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <CalendarDays className="mr-2 h-4 w-4" />
          {format(new Date(event.start_time), "PPP p")}
        </div>
        {event.request_count !== undefined && (
            <div className="text-sm font-medium">
                {event.request_count} requests
            </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button asChild className="w-full" variant={isLive ? "default" : "outline"}>
          <Link href={isLive ? `/dashboard/live` : `/dashboard/events/${event.id}`}>
            {isLive ? "Manage Live" : "View Details"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
