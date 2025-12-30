"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@supabase/supabase-js";
import { 
  ArrowLeft, 
  Settings, 
  MapPin, 
  Calendar, 
  Music,
  DollarSign,
  Loader2,
  Clock,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

// Client Side Supabase
function getClientSupabase() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

export default function CreateEventPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  
  // Time State 12H
  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("PM");
  
  const [endHour, setEndHour] = useState("02");
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState("AM");

  // Pricing & Settings
  const [eventType, setEventType] = useState("club");
  const [minPrice, setMinPrice] = useState("5");

  const constructDateTime = (dateStr: string, h: string, m: string, p: string) => {
       let hour = parseInt(h);
       if (p === "PM" && hour !== 12) hour += 12;
       if (p === "AM" && hour === 12) hour = 0;
       
       // Create Date Object in Local Time (Browser)
       const d = new Date(`${dateStr}T${hour.toString().padStart(2, "0")}:${m}:00`);
       return d;
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!name || !venue || !date) {
        toast.error("Please fill in all required fields");
        return;
    }

    setIsLoading(true);
    try {
      const supabase = getClientSupabase();
      
      // 1. Calculate Timestamps
      const startObj = constructDateTime(date, startHour, startMinute, startPeriod);
      let endObj = constructDateTime(date, endHour, endMinute, endPeriod);
      
      // Auto-detect overnight events (e.g. 9PM to 2AM)
      if (endObj < startObj) {
          endObj.setDate(endObj.getDate() + 1);
      }

      // 2. Generate Slug
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const uniqueSlug = `${cleanName}-${Math.random().toString(36).substring(2, 7)}`;

      // 3. Create Event
      const { data, error } = await supabase
        .from("events")
        .insert({
          user_id: user.id, // RLS Ownership
          name,
          venue_name: venue,
          start_time: startObj.toISOString(),
          end_time: endObj.toISOString(),
          event_type: eventType,
          unique_slug: uniqueSlug,
          status: "draft",
          
          // Default Pricing
          price_single: parseFloat(minPrice),
          price_priority: parseFloat(minPrice) * 2,
          price_shoutout: 5,
          price_guaranteed: 20
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Event created successfully!");
      router.push(`/dashboard/events/${data.id}`);
      
    } catch (error: any) {
      console.error("Create failed:", error);
      toast.error("Failed to create event");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Link href="/dashboard/events" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            Create New Event
          </h1>
          <p className="text-gray-400 mt-2">Set up your next gig in seconds.</p>
        </div>

        <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-6 md:p-8 space-y-6">
          
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Event Name *</label>
              <input
                type="text"
                placeholder="e.g. Saturday Night Live"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Venue *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="e.g. The Grand Club"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl pl-10 pr-4 py-3 text-white focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Date & Time (The Fix) */}
          <div className="space-y-4">
             <label className="block text-sm font-medium text-gray-300">When is it?</label>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date */}
                <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                    <input 
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl pl-10 pr-4 py-3 text-white focus:border-purple-500 [color-scheme:dark]"
                    />
                </div>

                {/* Start Time */}
                <div className="flex bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl overflow-hidden text-white">
                    <select value={startHour} onChange={e => setStartHour(e.target.value)} className="bg-transparent px-2 py-3 outline-none text-center w-full appearance-none">
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="self-center text-gray-500">:</span>
                    <select value={startMinute} onChange={e => setStartMinute(e.target.value)} className="bg-transparent px-2 py-3 outline-none text-center w-full appearance-none">
                        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={startPeriod} onChange={e => setStartPeriod(e.target.value)} className="bg-purple-900/30 text-purple-300 px-2 py-3 outline-none font-bold text-center w-full">
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                    </select>
                </div>

                {/* End Time */}
                <div className="flex bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl overflow-hidden text-white">
                    <select value={endHour} onChange={e => setEndHour(e.target.value)} className="bg-transparent px-2 py-3 outline-none text-center w-full appearance-none">
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="self-center text-gray-500">:</span>
                    <select value={endMinute} onChange={e => setEndMinute(e.target.value)} className="bg-transparent px-2 py-3 outline-none text-center w-full appearance-none">
                        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={endPeriod} onChange={e => setEndPeriod(e.target.value)} className="bg-purple-900/30 text-purple-300 px-2 py-3 outline-none font-bold text-center w-full">
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                    </select>
                </div>
             </div>
             <p className="text-xs text-gray-500">End time automatically adjusts to the next day if needed.</p>
          </div>

          <div className="h-px bg-[#2D2D2D] my-6" />

          {/* Pricing */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Base Request Price ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="number"
                min="0"
                step="1"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl pl-10 pr-4 py-3 text-white focus:border-purple-500 transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            create Event
          </button>

        </div>
      </div>
    </div>
  );
}
