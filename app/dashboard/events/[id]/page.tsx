import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, MapPin, QrCode as QrIcon } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

async function getEvent(id: string) {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${url}/api/events/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Failed to fetch event:", error);
    return null;
  }
}

export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Event Details</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{event.venue_name} {event.venue_address && `- ${event.venue_address}`}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(event.start_time), "PPP p")}</span>
            </div>
            <div className="p-4 bg-muted rounded-lg mt-4">
                <h4 className="font-semibold mb-2">Public Portal URL</h4>
                <a href={`/e/${event.unique_slug}`} target="_blank" className="text-blue-500 hover:underline break-all">
                    {process.env.NEXT_PUBLIC_APP_URL}/e/{event.unique_slug}
                </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <QrIcon className="h-5 w-5" /> QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {event.qr_code_url ? (
                <>
                    <img src={event.qr_code_url} alt="Event QR Code" className="w-48 h-48 mb-4 border rounded-lg" />
                    <Button asChild variant="secondary" className="w-full">
                        <a href={event.qr_code_url} download={`qr-${event.unique_slug}.png`}>
                            Download QR
                        </a>
                    </Button>
                </>
            ) : (
                <div className="text-sm text-muted-foreground">No QR Code generated</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder for stats/requests table */}
      <Card>
          <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                  Requests will appear here once the event goes live.
              </div>
          </CardContent>
      </Card>
    </div>
  )
}
