"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

    // Validate end time is after start time
    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
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
          start_time: new Date(formData.start_time).toISOString(),
          end_time: new Date(formData.end_time).toISOString(),
          event_type: formData.event_type,
          custom_message: formData.custom_message.trim() || null,
          base_price: 5.00, // Fixed price
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      toast.success("Event created successfully!");
      
      // Small delay to show success message before redirect
      setTimeout(() => {
        router.push(`/dashboard/events/${data.id}`);
      }, 500);
      
    } catch (error) {
      console.error("Create event error:", error);
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get minimum datetime (now)
  const now = new Date();
  // Adjust for timezone offset to show correct local time in min attribute
  const tzOffset = now.getTimezoneOffset() * 60000;
  const localIso = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Create New Event
          </h1>
          <p className="text-gray-400 mt-2">
            Fill in the details below to generate a new request portal and QR code.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1A1A1B] rounded-xl p-6 space-y-6 border border-[#2D2D2D]">
            
            {/* Event Name & Venue Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Name <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Friday Night Vibes"
                  className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Venue Name <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  name="venue_name"
                  value={formData.venue_name}
                  onChange={handleChange}
                  placeholder="The Grand Club"
                  className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                  required
                />
              </div>
            </div>

            {/* Venue Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Venue Address <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                name="venue_address"
                value={formData.venue_address}
                onChange={handleChange}
                placeholder="123 Party Lane, Toronto, ON"
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>

            {/* Start Time & End Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Time <span className="text-pink-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  min={localIso}
                  className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition [color-scheme:dark]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Time <span className="text-pink-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  min={formData.start_time || localIso}
                  className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition [color-scheme:dark]"
                  required
                />
              </div>
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { value: "club", label: "?? Club Night" },
                  { value: "wedding", label: "?? Wedding" },
                  { value: "private", label: "?? Private" },
                  { value: "bar", label: "?? Bar Gig" },
                  { value: "other", label: "? Other" },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, event_type: type.value }))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      formData.event_type === type.value
                        ? "bg-purple-600 text-white border-2 border-purple-400"
                        : "bg-[#0A0A0B] text-gray-300 border border-[#2D2D2D] hover:border-purple-500"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Message <span className="text-gray-500">(Optional)</span>
              </label>
              <textarea
                name="custom_message"
                value={formData.custom_message}
                onChange={handleChange}
                placeholder="Welcome to the party! Requests help support the DJ."
                rows={3}
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition resize-none"
              />
              <p className="text-gray-500 text-sm mt-1">
                This will be displayed on the public request portal.
              </p>
            </div>

            {/* Pricing Info */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 border border-purple-500/30">
              <h3 className="text-sm font-semibold text-purple-300 mb-2">?? Request Pricing</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-white font-bold">$5</div>
                  <div className="text-gray-400">Single Song</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">$8</div>
                  <div className="text-gray-400">Double Up</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">$12</div>
                  <div className="text-gray-400">Party Pack</div>
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-2 text-center">
                + Premium add-ons: Priority ($10) • Shoutout ($5) • Guaranteed Next ($20)
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition ${
              isLoading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Event...
              </span>
            ) : (
              "?? Create Event & Generate QR Code"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

