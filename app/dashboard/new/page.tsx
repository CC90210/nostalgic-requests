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
  Sparkles
} from "lucide-react";

const EVENT_TYPES = [
  { value: "club", label: "Club Night", icon: Music },
  { value: "wedding", label: "Wedding", icon: Heart },
  { value: "private", label: "Private Party", icon: PartyPopper },
  { value: "bar", label: "Bar Gig", icon: Beer },
  { value: "other", label: "Other", icon: Sparkles },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    venue_name: "",
    venue_address: "",
    start_time: "",
    end_time: "",
    event_type: "club",
    custom_message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter an event name");
      return;
    }
    if (!formData.venue_name.trim()) {
      toast.error("Please enter a venue name");
      return;
    }
    if (!formData.start_time) {
      toast.error("Please select a start time");
      return;
    }
    if (!formData.end_time) {
      toast.error("Please select an end time");
      return;
    }

    const startDate = new Date(formData.start_time);
    const endDate = new Date(formData.end_time);
    
    if (endDate <= startDate) {
      toast.error("End time must be after start time");
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
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get minimum datetime (now)
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Create New Event</h1>
          <p className="text-gray-400 mt-2">
            Set up your gig and generate a QR code for song requests.
          </p>
        </div>

        {/* Form */}
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
                  className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                  className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Start Time & End Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Start Time <span className="text-pink-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  min={minDateTime}
                  className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all [color-scheme:dark]"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  End Time <span className="text-pink-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  min={formData.start_time || minDateTime}
                  className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all [color-scheme:dark]"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Event Type
              </label>
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
                          ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white border-2 border-purple-400 shadow-lg shadow-purple-500/20"
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
                placeholder="Welcome to the party! Request your favorite songs and support the DJ."
                rows={3}
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                disabled={isLoading}
              />
              <p className="text-gray-500 text-xs mt-2">
                This message will be displayed on your public request portal.
              </p>
            </div>

            {/* Pricing Info */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/30">
              <h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Request Pricing (Fixed)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">$5</div>
                  <div className="text-gray-400 text-xs">Single Song</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">$8</div>
                  <div className="text-gray-400 text-xs">Double Up</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">$12</div>
                  <div className="text-gray-400 text-xs">Party Pack</div>
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-3 text-center">
                + Add-ons: Priority ($10) • Shoutout ($5) • Guaranteed Next ($20)
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              isLoading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
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

