import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
           // Read-only logic for Server Components
        },
      },
    }
  );
  
  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch Profile
  const { data: profile } = await supabase
    .from("dj_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // 3. Fetch Events (FORCE FILTER by User ID)
  // This acts as a double-lock protecting data even if RLS is broken.
  const { data: eventsData } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", user.id) // <--- CRITICAL SECURITY FIX
    .order("start_time", { ascending: false });

  const events = eventsData || [];
  const liveEvent = events.find((e: any) => e.status === "live") || null;

  // 4. Fetch Stats
  let totalRevenue = 0;
  let totalRequests = 0;
  const eventIds = events.map((e: any) => e.id);

  if (eventIds.length > 0) {
    const { data: validRequests } = await supabase
        .from("requests")
        .select("amount_paid")
        .in("event_id", eventIds)
        .eq("is_paid", true);

    if (validRequests) {
        totalRequests = validRequests.length;
        totalRevenue = validRequests.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
    }
  }

  const stats = {
    totalRevenue,
    totalEvents: events.length,
    totalRequests,
    liveEvent,
    recentEvents: events.slice(0, 5)
  };

  const djName = user.user_metadata?.dj_name || profile?.dj_name || "DJ";
  const phone = user.user_metadata?.phone || profile?.phone || "";

  return (
    <DashboardOverview 
        user={user} 
        stats={stats} 
        djName={djName} 
        phone={phone}
    />
  );
}
