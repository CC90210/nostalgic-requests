import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MyEventsOverview from "@/components/dashboard/MyEventsOverview";

export const dynamic = "force-dynamic";

export default async function MyEventsPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
       cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {}
       }
    }
  );
  
  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch Events (FORCE FILTER by User ID)
  // This ensures "DJ Kenny" ONLY gets Kenny's events, regardless of key permissions.
  const { data: eventsData, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", user.id) // <--- CRITICAL SECURITY FIX
    .order("created_at", { ascending: false });

  if (error) {
      console.error("Events fetch error:", error);
      return <div className="text-white p-8">Failed to load events.</div>;
  }

  const events = eventsData || [];

  return (
    <MyEventsOverview events={events} />
  );
}
