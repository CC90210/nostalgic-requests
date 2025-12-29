import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { ArrowRight, Calendar, DollarSign, Music, Users, PlusCircle, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

export const revalidate = 0; // Disable static caching for dashboard home

export default async function DashboardHome() {
  // Fetch stats concurrently
  const [
    { count: eventsCount },
    { count: requestsCount },
    { data: leadsData },
    { data: recentEvents },
    { data: allPaymentRequests } // Need to sum amount_paid manually or use RPC
  ] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("requests").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact" }),
    supabase.from("events").select("*").order("created_at", { ascending: false }).limit(4),
    supabase.from("requests").select("amount_paid")
  ])

  // Calculate total revenue
  const totalRevenue = allPaymentRequests?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0
  const totalLeads = leadsData?.length || 0 // count return is a bit weird with select data, using length for small sets is fine, otherwise count
  
  // Find active event
  const activeEvent = recentEvents?.find(e => e.status !== "ended")

  // Chart data placeholder (would verify recharts integration later)
  
  return (
    <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Good evening, DJ ?? Ready to make some noise?
                </p>
            </div>
            <div className="flex gap-3">
                 <Button asChild variant="outline">
                    <Link href="/dashboard/events">View History</Link>
                </Button>
                <Button asChild>
                    <Link href="/dashboard/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Event
                    </Link>
                </Button>
            </div>
        </div>

        {/* Active Event Banner */}
        {activeEvent && (
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-xl p-6 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                     <Activity className="h-48 w-48 text-white" />
                 </div>
                 <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                     <div className="space-y-2 text-center md:text-left">
                         <div className="inline-flex items-center rounded-full border border-red-500/50 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500 animate-pulse">
                            ?? LIVE NOW
                         </div>
                         <h2 className="text-2xl font-bold text-white">{activeEvent.name}</h2>
                         <p className="text-purple-200 flex items-center gap-2 justify-center md:justify-start">
                             <MapPin className="h-4 w-4" /> {activeEvent.venue_name}
                         </p>
                     </div>
                     <Button size="lg" className="bg-white text-purple-900 hover:bg-gray-100 font-bold shadow-lg shadow-purple-900/20" asChild>
                         <Link href="/dashboard/live">
                            Open Live Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                         </Link>
                     </Button>
                 </div>
            </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <Music className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{requestsCount || 0}</div>
                    <p className="text-xs text-muted-foreground">Songs requested</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    <Calendar className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{eventsCount || 0}</div>
                    <p className="text-xs text-muted-foreground">Gigs played</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Leads Collected</CardTitle>
                    <Users className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalLeads}</div>
                    <p className="text-xs text-muted-foreground">Unique customers</p>
                </CardContent>
            </Card>
        </div>

        {/* Recent Events */}
        <div className="grid gap-4 grid-cols-1">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Recent Events</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {recentEvents?.map((event) => (
                     <Card key={event.id} className="hover:bg-accent/40 transition-colors cursor-pointer group">
                         <CardHeader>
                             <CardTitle className="flex justify-between items-start">
                                 <span className="truncate group-hover:text-primary transition-colors">{event.name}</span>
                                 <span className={`text-xs px-2 py-1 rounded-full border ${event.status === "live" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-secondary text-muted-foreground"}`}>
                                    {event.status.toUpperCase()}
                                 </span>
                             </CardTitle>
                             <p className="text-sm text-muted-foreground flex items-center gap-1">
                                 <MapPin className="h-3 w-3" /> {event.venue_name}
                             </p>
                         </CardHeader>
                         <CardContent>
                             <div className="flex items-center justify-between text-sm">
                                 <span className="text-muted-foreground">{formatDistanceToNow(new Date(event.created_at))} ago</span>
                                 <Button variant="link" asChild className="p-0 h-auto">
                                     <Link href={`/dashboard/events/${event.id}`}>Details &rarr;</Link>
                                 </Button>
                             </div>
                         </CardContent>
                     </Card>
                 ))}
                 {(!recentEvents || recentEvents.length === 0) && (
                     <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                         No events yet. Create one to get started!
                     </div>
                 )}
            </div>
        </div>
    </div>
  )
}

function MapPin({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
}
