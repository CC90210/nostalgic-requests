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
  CheckCircle,
  Info
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

  // FULL PRICING GRID
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
      
      const startObj = constructDateTime(date, startHour, startMinute, startPeriod);
      let endObj = constructDateTime(date, endHour, endMinute, endPeriod);
      
      if (endObj < startObj) {
          endObj.setDate(endObj.getDate() + 1);
      }

      const cleanName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const uniqueSlug = `${cleanName}-${Math.random().toString(36).substring(2, 7)}`;

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
    <div className="min-h-screen bg-[#0A0A0B] p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header - Transparent & Wide */}
        <div className="mb-12">
          <Link href="/dashboard/events" className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight flex items-center gap-3">
              <Sparkles className="w-10 h-10 text-purple-500" />
              Create Event
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl">
              Configure your event details, schedule, and pricing strategy for maximum revenue.
            </p>
          </div>
        </div>

        <div className="space-y-16">
          
          {/* Section 1: Event Basics */}
          <section className="space-y-6">
             <div className="border-b border-white/5 pb-4 mb-6">
                 <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                     <Music className="w-6 h-6 text-purple-400" /> Basic Information
                 </h2>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Event Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Saturday Night Live @ The Grand"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#1A1A1B] border border-[#2D2D2D] rounded-xl px-5 py-4 text-white text-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-600"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Venue Name</label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-4.5 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="e.g. The Grand Club"
                            value={venue}
                            onChange={(e) => setVenue(e.target.value)}
                            className="w-full bg-[#1A1A1B] border border-[#2D2D2D] rounded-xl pl-12 pr-5 py-4 text-white text-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-600"
                        />
                    </div>
                </div>
             </div>
          </section>

          {/* Section 2: Schedule */}
          <section className="space-y-6">
             <div className="border-b border-white/5 pb-4 mb-6">
                 <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                     <Calendar className="w-6 h-6 text-blue-400" /> Date & Schedule
                 </h2>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Event Date</label>
                    <input 
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-[#1A1A1B] border border-[#2D2D2D] rounded-xl px-5 py-4 text-white text-lg focus:border-purple-500 [color-scheme:dark]"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Start Time</label>
                    <div className="flex bg-[#1A1A1B] border border-[#2D2D2D] rounded-xl overflow-hidden text-white h-[60px]">
                        <select value={startHour} onChange={e => setStartHour(e.target.value)} className="flex-1 bg-transparent text-center text-lg outline-none cursor-pointer hover:bg-white/5 transition-colors appearance-none">
                            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="self-center text-gray-600">:</span>
                        <select value={startMinute} onChange={e => setStartMinute(e.target.value)} className="flex-1 bg-transparent text-center text-lg outline-none cursor-pointer hover:bg-white/5 transition-colors appearance-none">
                            {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={startPeriod} onChange={e => setStartPeriod(e.target.value)} className="w-20 bg-purple-500/10 text-purple-400 font-bold text-center outline-none cursor-pointer hover:bg-purple-500/20 transition-colors">
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">End Time</label>
                    <div className="flex bg-[#1A1A1B] border border-[#2D2D2D] rounded-xl overflow-hidden text-white h-[60px]">
                        <select value={endHour} onChange={e => setEndHour(e.target.value)} className="flex-1 bg-transparent text-center text-lg outline-none cursor-pointer hover:bg-white/5 transition-colors appearance-none">
                            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="self-center text-gray-600">:</span>
                        <select value={endMinute} onChange={e => setEndMinute(e.target.value)} className="flex-1 bg-transparent text-center text-lg outline-none cursor-pointer hover:bg-white/5 transition-colors appearance-none">
                            {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={endPeriod} onChange={e => setEndPeriod(e.target.value)} className="w-20 bg-purple-500/10 text-purple-400 font-bold text-center outline-none cursor-pointer hover:bg-purple-500/20 transition-colors">
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                        </select>
                    </div>
                </div>
             </div>
             <div className="flex items-center gap-2 text-gray-500 text-sm max-w-5xl">
                <Info className="w-4 h-4" />
                <span>End time automatically adjusts to the next day if earlier than start time (e.g., 9 PM - 2 AM).</span>
             </div>
          </section>

          {/* Section 3: Pricing Strategy */}
          <section className="space-y-6">
             <div className="border-b border-white/5 pb-4 mb-6">
                 <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                     <DollarSign className="w-6 h-6 text-green-400" /> Pricing Strategy
                 </h2>
             </div>

             <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
                <PriceInput 
                    label="Single Request" 
                    subLabel="Base price per song"
                    icon={<Music className="w-5 h-5 text-gray-400"/>} 
                    value={pricing.single} 
                    onChange={v => handlePricingChange("single", v)} 
                    color="gray"
                />
                <PriceInput 
                    label="Double Pack" 
                    subLabel="Discount for 2 songs"
                    icon={<Music className="w-5 h-5 text-purple-400"/>} 
                    value={pricing.double} 
                    onChange={v => handlePricingChange("double", v)} 
                    color="purple"
                />
                <PriceInput 
                    label="Party Pack (5)" 
                    subLabel="Bulk discount"
                    icon={<Sparkles className="w-5 h-5 text-pink-400"/>} 
                    value={pricing.party} 
                    onChange={v => handlePricingChange("party", v)} 
                    color="pink"
                />
                <PriceInput 
                    label="Priority Play" 
                    subLabel="Jump the queue"
                    icon={<Zap className="w-5 h-5 text-yellow-400"/>} 
                    value={pricing.priority} 
                    onChange={v => handlePricingChange("priority", v)} 
                    color="yellow"
                />
                <PriceInput 
                    label="Shoutout" 
                    subLabel="DJ reads message"
                    icon={<Megaphone className="w-5 h-5 text-blue-400"/>} 
                    value={pricing.shoutout} 
                    onChange={v => handlePricingChange("shoutout", v)} 
                    color="blue"
                />
                <PriceInput 
                    label="Guaranteed Next" 
                    subLabel="Play literally next"
                    icon={<CheckCircle className="w-5 h-5 text-green-400"/>} 
                    value={pricing.guaranteed} 
                    onChange={v => handlePricingChange("guaranteed", v)} 
                    color="green"
                />
             </div>
          </section>

          {/* Action Bar */}
          <div className="pt-8 border-t border-white/10 flex justify-end max-w-5xl">
              <button
                onClick={handleCreate}
                disabled={isLoading}
                className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-lg font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-900/20 transform hover:-translate-y-1 active:translate-y-0"
            >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                Launch Event Dashboard
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function PriceInput({ label, subLabel, icon, value, onChange, color }: any) {
    const borderColors: any = {
        gray: "focus-within:border-gray-500",
        purple: "focus-within:border-purple-500",
        pink: "focus-within:border-pink-500",
        yellow: "focus-within:border-yellow-500",
        blue: "focus-within:border-blue-500",
        green: "focus-within:border-green-500",
    };

    return (
        <div className={`bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:bg-[#222224] ${borderColors[color]}`}>
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 font-semibold text-white mb-1">
                        {icon} {label}
                    </div>
                    <div className="text-xs text-gray-500">{subLabel}</div>
                </div>
            </div>
            <div className="relative mt-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">$</span>
                <input 
                    type="number" 
                    min="0" 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    className="w-full bg-[#0A0A0B] border border-[#333] rounded-lg pl-8 pr-4 py-3 text-2xl font-bold text-white placeholder-gray-700 outline-none focus:border-white/20 transition-colors"
                    placeholder="0"
                />
            </div>
        </div>
    );
}
