"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { User, Phone, FileText, Image, Loader2, Save, Disc, AlertCircle } from "lucide-react";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function SettingsPage() {
  const { user, profile, loading, profileLoading, refreshProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    dj_name: "",
    full_name: "",
    phone: "",
    bio: "",
    profile_image_url: "",
  });

  // Pre-fill form when profile loads
  useEffect(() => {
    if (profile) {
      console.log("[Settings] Pre-filling form with profile:", profile.dj_name);
      setFormData({
        dj_name: profile.dj_name || "",
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        profile_image_url: profile.profile_image_url || "",
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!formData.dj_name.trim()) {
      toast.error("DJ Name is required");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = getSupabaseClient();
      
      console.log("[Settings] Updating profile for user:", user.id);
      
      const updateData = {
        dj_name: formData.dj_name.trim(),
        full_name: formData.full_name.trim() || null,
        phone: formData.phone.trim() || null,
        bio: formData.bio.trim() || null,
        profile_image_url: formData.profile_image_url.trim() || null,
      };

      const { data, error } = await supabase
        .from("dj_profiles")
        .update(updateData)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("[Settings] Update error:", error);
        toast.error("Failed to update: " + error.message);
        return;
      }

      console.log("[Settings] Update successful:", data);
      await refreshProfile();
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("[Settings] Exception:", error);
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading only during initial auth check
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // No user - redirect handled by layout
  if (!user) {
    return null;
  }

  // Profile not found - show error state
  if (!profile && !profileLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#1A1A1B] rounded-2xl p-8 border border-[#2D2D2D] text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
            <p className="text-gray-400 mb-4">
              We could not find your DJ profile. This can happen if:
            </p>
            <ul className="text-gray-500 text-sm text-left max-w-md mx-auto mb-6 space-y-2">
              <li>• The profile was not created during signup</li>
              <li>• There is a database sync issue</li>
              <li>• Row Level Security is blocking access</li>
            </ul>
            <div className="bg-[#0A0A0B] rounded-xl p-4 text-left">
              <p className="text-gray-400 text-xs mb-2">Debug Info:</p>
              <p className="text-gray-500 text-xs font-mono">
                User ID: {user.id}<br />
                Email: {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Still loading profile
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-2">Manage your DJ profile and account details.</p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1A1A1B] rounded-2xl p-6 border border-[#2D2D2D] space-y-6">
            {/* Avatar Preview */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center overflow-hidden">
                {formData.profile_image_url ? (
                  <img 
                    src={formData.profile_image_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <Disc className="w-10 h-10 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{formData.dj_name || "Your DJ Name"}</h2>
                <p className="text-gray-400 text-sm">{profile?.email}</p>
              </div>
            </div>

            {/* DJ Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Disc className="w-4 h-4 inline mr-2" />
                DJ Name <span className="text-pink-500">*</span>
              </label>
              <input
                type="text"
                value={formData.dj_name}
                onChange={(e) => setFormData({ ...formData, dj_name: e.target.value })}
                placeholder="DJ Nostalgic"
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                disabled={isSaving}
                required
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Smith"
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                disabled={isSaving}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                disabled={isSaving}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell your audience about yourself..."
                rows={4}
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                disabled={isSaving}
              />
            </div>

            {/* Profile Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Image className="w-4 h-4 inline mr-2" />
                Profile Image URL
              </label>
              <input
                type="url"
                value={formData.profile_image_url}
                onChange={(e) => setFormData({ ...formData, profile_image_url: e.target.value })}
                placeholder="https://example.com/your-photo.jpg"
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
              isSaving
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

