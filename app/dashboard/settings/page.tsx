"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { User, Phone, FileText, Image, Loader2, Save, Disc, RefreshCw } from "lucide-react";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function SettingsPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [formData, setFormData] = useState({
    dj_name: "",
    full_name: "",
    phone: "",
    bio: "",
    profile_image_url: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        dj_name: profile.dj_name || "",
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        profile_image_url: profile.profile_image_url || "",
      });
    }
  }, [profile]);

  const handleRecoverProfile = async () => {
    setIsRecovering(true);
    toast.info("Recovering profile...");
    
    const recovered = await refreshProfile();
    
    if (recovered) {
      toast.success("Profile recovered!");
    } else {
      toast.error("Recovery failed. Please try signing out and back in.");
    }
    
    setIsRecovering(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!formData.dj_name.trim()) {
      toast.error("DJ Name is required");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("dj_profiles")
        .update({
          dj_name: formData.dj_name.trim(),
          full_name: formData.full_name.trim() || null,
          phone: formData.phone.trim() || null,
          bio: formData.bio.trim() || null,
          profile_image_url: formData.profile_image_url.trim() || null,
        })
        .eq("user_id", user.id);

      if (error) {
        toast.error("Failed to update: " + error.message);
        return;
      }

      await refreshProfile();
      toast.success("Profile updated!");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // Profile missing - Show recovery option instead of error
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#1A1A1B] rounded-2xl p-8 border border-[#2D2D2D] text-center">
            <Loader2 className={`w-16 h-16 mx-auto mb-4 ${isRecovering ? "animate-spin text-purple-500" : "text-yellow-500"}`} />
            <h2 className="text-2xl font-bold text-white mb-2">
              {isRecovering ? "Recovering Profile..." : "Syncing Your Profile"}
            </h2>
            <p className="text-gray-400 mb-6">
              {isRecovering 
                ? "Please wait while we create your profile..."
                : "Your profile is being set up. This should only take a moment."
              }
            </p>
            
            {!isRecovering && (
              <button
                onClick={handleRecoverProfile}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-xl text-white font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                Create Profile Now
              </button>
            )}
            
            <div className="mt-6 bg-[#0A0A0B] rounded-xl p-4 text-left">
              <p className="text-gray-500 text-xs">Debug: User ID: {user.id}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-2">Manage your DJ profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1A1A1B] rounded-2xl p-6 border border-[#2D2D2D] space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center overflow-hidden">
                {formData.profile_image_url ? (
                  <img src={formData.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Disc className="w-10 h-10 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{formData.dj_name || "Your DJ Name"}</h2>
                <p className="text-gray-400 text-sm">{profile.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">DJ Name *</label>
              <input
                type="text"
                value={formData.dj_name}
                onChange={(e) => setFormData({ ...formData, dj_name: e.target.value })}
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500"
                disabled={isSaving}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500 resize-none"
                disabled={isSaving}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

