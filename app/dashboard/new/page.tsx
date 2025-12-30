"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@supabase/supabase-js";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Type, 
  MessageSquare, 
  Sparkles, 
  ArrowRight,
  Loader2,
  DollarSign
} from "lucide-react";

function getClientSupabase() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 30);
  const random = Math.random().toString(36).substring(2, 8);
  return `${base}-${random}`;
}

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    venue_name: "",
    venue_address: "",
    start_time: "",
    end_time: "",
    event_type: "party",
    custom_message: "",
    // Pricing
    price_single: 5.00,
    price_double: 8.00,
    price_party: 12.00,
    price_priority: 10.00,
    price_shoutout: 5.00,
    price_guaranteed: 20.00
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.startsWith("price_") ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!user) {
        setError("You must be logged in.");
        setIsSubmitting(false);
        return;
    }

    try {
      const unique_slug = generateSlug(formData.name);
      
      const supabase = getClientSupabase();
      
      const { data, error: insertError } = await supabase
        .from("events")
        .insert({
          user_id: user.id, // Explicit ownership
          name: formData.name,
          venue_name: formData.venue_name,
          venue_address: formData.venue_address || null,
          start_time: formData.start_time,
          end_time: formData.end_time,
          event_type: formData.event_type,
          custom_message: formData.custom_message || null,
          status: "draft",
          unique_slug,
          // Pricing
          price_single: formData.price_single,
          price_double: formData.price_double,
          price_party: formData.price_party,
          price_priority: formData.price_priority,
          price_shoutout: formData.price_shoutout,
          price_guaranteed: formData.price_guaranteed,
          base_price: formData.price_single // Sync
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      router.push(`/dashboard/events/${data.id}`);
      router.refresh(); // Ensure My Events list updates
    } catch (err: any) {
      console.error("Create event error:", err);
      setError(err.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Create New Event</h1>
          <p className="text-gray-400 mt-2">Set up your next gig and start accepting requests</p>
        </div>

        {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl mb-6">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Essential Info */}
          <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Event Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Name *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Type className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Saturday Night Vibes"
                    className="w-full pl-10 pr-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Venue Name *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      name="venue_name"
                      required
                      value={formData.venue_name}
                      onChange={handleChange}
                      placeholder="e.g. The Blue Club"
                      className="w-full pl-10 pr-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500"
                    />
                  </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-300 mb-2">Event Type</label>
                   <select 
                      name="event_type"
                      value={formData.event_type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500"
                   >
                      <option value="party">Party / Club</option>
                      <option value="wedding">Wedding</option>
                      <option value="corporate">Corporate</option>
                      <option value="live_show">Live Show</option>
                      <option value="other">Other</option>
                   </select>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Timing */}
          <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-purple-400" />
              Date & Time
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Time *</label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    required
                    value={formData.start_time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500 [color-scheme:dark]"
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Time *</label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    required
                    value={formData.end_time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500 [color-scheme:dark]"
                  />
                </div>
            </div>
          </div>

          {/* 3. Pricing */}
          <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-6">
             <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <DollarSign className="w-5 h-5 text-green-400" />
                Pricing Configuration
             </h2>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Single Song</label>
                    <input type="number" name="price_single" value={formData.price_single} onChange={handleChange} className="w-full mt-1 bg-black/40 border-gray-700 text-white rounded p-2" />
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Double Pack</label>
                    <input type="number" name="price_double" value={formData.price_double} onChange={handleChange} className="w-full mt-1 bg-black/40 border-gray-700 text-white rounded p-2" />
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Party Pack</label>
                    <input type="number" name="price_party" value={formData.price_party} onChange={handleChange} className="w-full mt-1 bg-black/40 border-gray-700 text-white rounded p-2" />
                </div>
                <div>
                    <label className="text-xs text-amber-500 uppercase font-bold">Priority</label>
                    <input type="number" name="price_priority" value={formData.price_priority} onChange={handleChange} className="w-full mt-1 bg-black/40 border-gray-700 text-white rounded p-2" />
                </div>
                <div>
                    <label className="text-xs text-cyan-500 uppercase font-bold">Shoutout</label>
                    <input type="number" name="price_shoutout" value={formData.price_shoutout} onChange={handleChange} className="w-full mt-1 bg-black/40 border-gray-700 text-white rounded p-2" />
                </div>
                 <div>
                    <label className="text-xs text-red-500 uppercase font-bold">Guaranteed</label>
                    <input type="number" name="price_guaranteed" value={formData.price_guaranteed} onChange={handleChange} className="w-full mt-1 bg-black/40 border-gray-700 text-white rounded p-2" />
                </div>
             </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center gap-2 hover:from-purple-500 hover:to-pink-500 transition-all text-white shadow-lg shadow-purple-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Event...
              </>
            ) : (
              <>
                Create Event
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
