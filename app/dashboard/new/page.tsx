"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@supabase/supabase-js";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign,
  Loader2,
  Sparkles,
  Music,
  Megaphone,
  Zap,
  CheckCircle
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
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [eventType, setEventType] = useState("club");
  
  // Time State 12H
  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("PM");
  
  const [endHour, setEndHour] = useState("02");
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState("AM");

  // FULL PRICING GRID (Restored)
  const [pricing, setPricing] = useState({
      single: "5",
      double: "8",
      party: "12",
      priority: "10",
      shoutout: "5",
      guaranteed: "20"
  });

  const constructDateTime = (dateStr: string, h: string, m: string, p: string) => {
       let hour = parseInt(h);
       if (p === "PM" && hour !== 12) hour += 12;
       if (p === "AM" && hour === 12) hour = 0;
       return new Date(`${dateStr}T${hour.toString().padStart(2, "0")}:${m}:00`);
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
          user_id: user.id, 
          name,
          venue_name: venue,
          start_time: startObj.toISOString(),
          end_time: endObj.toISOString(),
          event_type: eventType,
          unique_slug: uniqueSlug,
          status: "draft",
          
          // Mapped Pricing Columns
          price_single: parseFloat(pricing.single) || 5,
          price_double: parseFloat(pricing.double) || 8,
          price_party: parseFloat(pricing.party) || 12,
          price_priority: parseFloat(pricing.priority) || 10,
          price_shoutout: parseFloat(pricing.shoutout) || 5,
          price_guaranteed: parseFloat(pricing.guaranteed) || 20
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Event created successfully!");
      router.push(`/dashboard/events/${data.id}`);
      
    } catch (error: any) {
      console.error("Create failed:", error);
      toast.error(error.message || "Failed to create event");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePricingChange = (key: keyof typeof pricing, val: string) => {
      setPricing(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        <div className="mb-8">
          <Link href="/dashboard/events" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            Create New Event
          </h1>
          <p className="text-gray-400 mt-2">Set up your event details and pricing strategy.</p>
        </div>

        <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-6 md:p-8 space-y-8">
          
          {/* Section 1: Event Details */}
          <div className="space-y-4">
             <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                 <Music className="w-5 h-5 text-purple-400" /> Basic Info
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Event Name *</label>
                <input
                    type="text"
                    placeholder="e.g. Saturday Night Live"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors"
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Venue *</label>
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
          </div>

          <div className="h-px bg-[#2D2D2D]" />

          {/* Section 2: Date & Time */}
          <div className="space-y-4">
             <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                 <Calendar className="w-5 h-5 text-blue-400" /> Date & Time
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <input 
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl px-4 py-3 text-white focus:border-purple-500 [color-scheme:dark]"
                    />
                </div>

                <div className="flex bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl overflow-hidden text-white items-center">
                    <span className="pl-3 text-xs text-gray-500 uppercase font-bold mr-1">Start</span>
                    <select value={startHour} onChange={e => setStartHour(e.target.value)} className="bg-transparent px-1 py-3 outline-none text-center appearance-none cursor-pointer hover:text-purple-400">
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="text-gray-600">:</span>
                    <select value={startMinute} onChange={e => setStartMinute(e.target.value)} className="bg-transparent px-1 py-3 outline-none text-center appearance-none cursor-pointer hover:text-purple-400">
                        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={startPeriod} onChange={e => setStartPeriod(e.target.value)} className="bg-purple-900/20 text-purple-400 px-2 py-1 ml-2 mr-2 rounded text-sm font-bold cursor-pointer">
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                    </select>
                </div>

                <div className="flex bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl overflow-hidden text-white items-center">
                    <span className="pl-3 text-xs text-gray-500 uppercase font-bold mr-1">End</span>
                    <select value={endHour} onChange={e => setEndHour(e.target.value)} className="bg-transparent px-1 py-3 outline-none text-center appearance-none cursor-pointer hover:text-purple-400">
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="text-gray-600">:</span>
                    <select value={endMinute} onChange={e => setEndMinute(e.target.value)} className="bg-transparent px-1 py-3 outline-none text-center appearance-none cursor-pointer hover:text-purple-400">
                        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={endPeriod} onChange={e => setEndPeriod(e.target.value)} className="bg-purple-900/20 text-purple-400 px-2 py-1 ml-2 mr-2 rounded text-sm font-bold cursor-pointer">
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                    </select>
                </div>
             </div>
          </div>

          <div className="h-px bg-[#2D2D2D]" />

          {/* Section 3: Pricing Configuration (Restored) */}
          <div className="space-y-4">
             <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                 <DollarSign className="w-5 h-5 text-green-400" /> Pricing Strategy
             </h3>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <PriceInput label="Single Song" icon={<Music className="w-4 h-4 text-gray-500"/>} value={pricing.single} onChange={v => handlePricingChange("single", v)} />
                <PriceInput label="Double Pack" icon={<Music className="w-4 h-4 text-purple-500"/>} value={pricing.double} onChange={v => handlePricingChange("double", v)} />
                <PriceInput label="Party Pack (5)" icon={<Sparkles className="w-4 h-4 text-pink-500"/>} value={pricing.party} onChange={v => handlePricingChange("party", v)} />
                <PriceInput label="Priority Play" icon={<Zap className="w-4 h-4 text-yellow-500"/>} value={pricing.priority} onChange={v => handlePricingChange("priority", v)} />
                <PriceInput label="Shoutout" icon={<Megaphone className="w-4 h-4 text-blue-500"/>} value={pricing.shoutout} onChange={v => handlePricingChange("shoutout", v)} />
                <PriceInput label="Guaranteed Next" icon={<CheckCircle className="w-4 h-4 text-green-500"/>} value={pricing.guaranteed} onChange={v => handlePricingChange("guaranteed", v)} />
             </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20 mt-8"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Launch Event Dashboard
          </button>

        </div>
      </div>
    </div>
  );
}

function PriceInput({ label, icon, value, onChange }: { label: string, icon: any, value: string, onChange: (v: string) => void }) {
    return (
        <div className="bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl p-3 flex flex-col gap-2 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                {icon} {label}
            </div>
            <div className="relative">
                <span className="absolute left-2 top-2 text-white font-bold">$</span>
                <input 
                    type="number" 
                    min="0" 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    className="w-full bg-transparent border-none outline-none pl-5 text-lg font-bold text-white placeholder-gray-600"
                    placeholder="0"
                />
            </div>
        </div>
    );
}
