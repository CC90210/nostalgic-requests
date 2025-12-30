"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Type, 
  MessageSquare, 
  Loader2,
  Music,
  PartyPopper,
  Heart,
  Beer,
  Sparkles,
  DollarSign
} from "lucide-react";

const EVENT_TYPES = [
  { value: "club", label: "Club Night", icon: Music },
  { value: "wedding", label: "Wedding", icon: Heart },
  { value: "private", label: "Private Party", icon: PartyPopper },
  { value: "bar", label: "Bar Gig", icon: Beer },
  { value: "other", label: "Other", icon: Sparkles },
];

const HOURS = [
  { value: "12", label: "12" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "10", label: "10" },
  { value: "11", label: "11" },
];

const MINUTES = ["00", "15", "30", "45"];

export default function CreateEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get today's date as default
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  
  const [formData, setFormData] = useState({
    name: "",
    venue_name: "",
    venue_address: "",
    start_date: todayStr,
    start_hour: "9",
    start_minute: "00",
    start_ampm: "PM",
    end_date: todayStr,
    end_hour: "2",
    end_minute: "00",
    end_ampm: "AM",
    event_type: "club",
    custom_message: "",
    
    // Dynamic Pricing (Defaults)
    price_single: 5,
    price_double: 8,
    price_party: 12,
    price_priority: 10,
    price_shoutout: 5,
    price_guaranteed: 20
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Auto-adjust end date if start date changes and end is before start
    if (name === "start_date" && value > formData.end_date) {
      setFormData((prev) => ({ ...prev, [name]: value, end_date: value }));
    }
    
    // If end time is AM and it's the same date, automatically move to next day
    if (name === "end_ampm" && value === "AM" && formData.start_date === formData.end_date && formData.start_ampm === "PM") {
      const nextDay = new Date(formData.start_date);
      nextDay.setDate(nextDay.getDate() + 1);
      setFormData((prev) => ({ ...prev, [name]: value, end_date: nextDay.toISOString().split("T")[0] }));
    }
  };

  const buildDateTime = (date: string, hour: string, minute: string, ampm: string): Date => {
    let hourNum = parseInt(hour);
    if (ampm === "PM" && hourNum !== 12) hourNum += 12;
    if (ampm === "AM" && hourNum === 12) hourNum = 0;
    
    const dt = new Date(date);
    dt.setHours(hourNum, parseInt(minute), 0, 0);
    return dt;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Please enter an event name");
      return;
    }
    if (!formData.venue_name.trim()) {
      toast.error("Please enter a venue name");
      return;
    }

    const startDate = buildDateTime(formData.start_date, formData.start_hour, formData.start_minute, formData.start_ampm);
    const endDate = buildDateTime(formData.end_date, formData.end_hour, formData.end_minute, formData.end_ampm);
    
    if (endDate <= startDate) {
      toast.error("End time must be after start time. For overnight events, select the next day for end date.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          venue_name: formData.venue_name.trim(),
          venue_address: formData.venue_address.trim() || null,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          event_type: formData.event_type,
          custom_message: formData.custom_message.trim() || null,
          
          // Pricing Columns
          price_single: Number(formData.price_single),
          price_double: Number(formData.price_double),
          price_party: Number(formData.price_party),
          price_priority: Number(formData.price_priority),
          price_shoutout: Number(formData.price_shoutout),
          price_guaranteed: Number(formData.price_guaranteed),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      toast.success("Event created successfully!");
      router.push(`/dashboard/events/${data.id}`);
      
    } catch (error: any) {
      console.error("Create event error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Create New Event</h1>
          <p className="text-gray-400 mt-2">Set up your gig and generate a QR code for song requests.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1A1A1B] rounded-2xl p-6 space-y-6 border border-[#2D2D2D]">
            
            {/* Event Name & Venue Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Type className="w-4 h-4 inline mr-2" />
                  Event Name <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Friday Night Vibes"
                  className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white placeholder-gray-500 focus:border-purple-500"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Venue Name <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  name="venue_name"
                  value={formData.venue_name}
                  onChange={handleChange}
                  placeholder="The Grand Club"
                  className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white placeholder-gray-500 focus:border-purple-500"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Venue Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Venue Address <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                name="venue_address"
                value={formData.venue_address}
                onChange={handleChange}
                placeholder="123 Party Lane, Toronto, ON"
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white placeholder-gray-500 focus:border-purple-500"
                disabled={isLoading}
              />
            </div>

            {/* Start Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Start Date & Time <span className="text-pink-500">*</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500 [color-scheme:dark]"
                  disabled={isLoading}
                />
                <select
                  name="start_hour"
                  value={formData.start_hour}
                  onChange={handleChange}
                  className="px-3 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500"
                  disabled={isLoading}
                >
                  {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
                <span className="text-gray-500 self-center">:</span>
                <select
                  name="start_minute"
                  value={formData.start_minute}
                  onChange={handleChange}
                  className="px-3 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500"
                  disabled={isLoading}
                >
                  {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select
                  name="start_ampm"
                  value={formData.start_ampm}
                  onChange={handleChange}
                  className="px-3 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500 font-medium"
                  disabled={isLoading}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* End Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                End Date & Time <span className="text-pink-500">*</span>
                <span className="text-gray-500 text-xs ml-2">(Select next day for overnight events)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={formData.start_date}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500 [color-scheme:dark]"
                  disabled={isLoading}
                />
                <select
                  name="end_hour"
                  value={formData.end_hour}
                  onChange={handleChange}
                  className="px-3 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500"
                  disabled={isLoading}
                >
                  {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
                <span className="text-gray-500 self-center">:</span>
                <select
                  name="end_minute"
                  value={formData.end_minute}
                  onChange={handleChange}
                  className="px-3 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500"
                  disabled={isLoading}
                >
                  {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select
                  name="end_ampm"
                  value={formData.end_ampm}
                  onChange={handleChange}
                  className="px-3 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500 font-medium"
                  disabled={isLoading}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Event Type</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {EVENT_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, event_type: type.value }))}
                      disabled={isLoading}
                      className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                        formData.event_type === type.value
                          ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white border-2 border-purple-400"
                          : "bg-[#0A0A0B] text-gray-300 border border-[#2D2D2D] hover:border-purple-500/50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Custom Message <span className="text-gray-500">(Optional)</span>
              </label>
              <textarea
                name="custom_message"
                value={formData.custom_message}
                onChange={handleChange}
                placeholder="Welcome to the party! Request your favorite songs."
                rows={3}
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white placeholder-gray-500 focus:border-purple-500 resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Dynamic Pricing Configuration */}
            <div className="bg-[#1A1A1B] border border-purple-500/30 rounded-xl p-5 overflow-hidden">
               <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <h3 className="font-bold text-white">Event Pricing</h3>
                  <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full">Customize</span>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                 {/* Single */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Single Song</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" name="price_single" value={formData.price_single} onChange={handleChange} className="w-full pl-7 pr-3 py-2 bg-black/40 border border-[#333] rounded-lg text-white focus:border-purple-500" />
                    </div>
                 </div>
                 {/* Double */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Double (2)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" name="price_double" value={formData.price_double} onChange={handleChange} className="w-full pl-7 pr-3 py-2 bg-black/40 border border-[#333] rounded-lg text-white focus:border-purple-500" />
                    </div>
                 </div>
                 {/* Party */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Party (3)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" name="price_party" value={formData.price_party} onChange={handleChange} className="w-full pl-7 pr-3 py-2 bg-black/40 border border-[#333] rounded-lg text-white focus:border-purple-500" />
                    </div>
                 </div>
                  {/* Priority */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-amber-500 uppercase tracking-widest">Fast Track</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" name="price_priority" value={formData.price_priority} onChange={handleChange} className="w-full pl-7 pr-3 py-2 bg-black/40 border border-[#333] rounded-lg text-white focus:border-amber-500" />
                    </div>
                 </div>
                  {/* Shoutout */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Shoutout</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" name="price_shoutout" value={formData.price_shoutout} onChange={handleChange} className="w-full pl-7 pr-3 py-2 bg-black/40 border border-[#333] rounded-lg text-white focus:border-cyan-500" />
                    </div>
                 </div>
                  {/* Guaranteed */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-red-500 uppercase tracking-widest">Guaranteed Next</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" name="price_guaranteed" value={formData.price_guaranteed} onChange={handleChange} className="w-full pl-7 pr-3 py-2 bg-black/40 border border-[#333] rounded-lg text-white focus:border-red-500" />
                    </div>
                 </div>
               </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              isLoading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Event...
              </span>
            ) : (
              "Create Event & Generate QR Code"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
