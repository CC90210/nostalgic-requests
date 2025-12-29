import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, MapPin, QrCode, User, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import QRCode from "qrcode"
import { format } from "date-fns"

export const dynamic = 'force-dynamic';

export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return <div>Loading...</div>;

  const { id } = await params
  const supabase = getSupabase();
  
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !event) {
    return notFound()
  }

  // Get QR Data URL
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/e/${event.unique_slug}`
  const qrCodeDataUrl = await QRCode.toDataURL(portalUrl)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${event.status === "live" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-secondary text-muted-foreground"}`}>
            {event.status.toUpperCase()}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.venue_name} {event.venue_address && <span className="text-muted-foreground">({event.venue_address})</span>}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(event.start_time), "PPP p")}</span>
                </div>
                {event.custom_message && (
                    <div className="p-3 bg-secondary/50 rounded-md text-sm italic">
                        "{event.custom_message}"
                    </div>
                )}
                 <Separator />
                 <div className="flex gap-4 pt-2">
                      <Button variant="outline" asChild>
                          <Link href={`/dashboard/live`}>Open Live Dashboard</Link>
                      </Button>
                 </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" /> Request Portal
                </CardTitle>
                <CardDescription>Share this with guests to accept requests</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
               <div className="bg-white p-4 rounded-xl">
                    <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
               </div>
               <div className="w-full text-center space-y-2">
                   <p className="text-xs text-muted-foreground font-mono bg-secondary p-2 rounded break-all">
                       {portalUrl}
                   </p>
                    <Button variant="secondary" className="w-full" asChild>
                        <Link href={portalUrl} target="_blank">
                            <Globe className="mr-2 h-4 w-4" /> Open Public Portal
                        </Link>
                    </Button>
               </div>
            </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
           <h2 className="text-xl font-bold">Recent Requests</h2>
           <div className="p-8 border-2 border-dashed rounded-xl text-center text-muted-foreground">
               Requests will appear here once the event starts.
           </div>
      </div>
    </div>
  )
}
