"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { User, Phone, FileText, Image, Loader2, Save, Disc, Banknote, ExternalLink, CheckCircle, Info, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [formData, setFormData] = useState({
    dj_name: "",
    full_name: "",
    phone: "",
    bio: "",
    profile_image_url: "",
  });

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("onboarding") === "success") {
        toast.success("Payouts connected successfully! You are ready to Go Live.");
        refreshProfile(); 
        router.refresh();
    }
  }, [searchParams, refreshProfile, router]);

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
    if (recovered) toast.success("Profile recovered!");
    else toast.error("Recovery failed.");
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
      const response = await fetch("/api/user/update", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            userId: user.id,
            dj_name: formData.dj_name.trim(),
            full_name: formData.full_name.trim() || null,
            phone: formData.phone.trim() || null,
            bio: formData.bio.trim() || null,
            profile_image_url: formData.profile_image_url.trim() || null,
         })
      });

      if (!response.ok) {
         const data = await response.json();
         throw new Error(data.error || "Update failed");
      }

      await refreshProfile();
      router.refresh(); 
      toast.success("Profile updated!");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
        const response = await fetch("/api/stripe/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user?.id, email: user?.email })
        });
        const data = await response.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.error || "Failed to get onboarding link");
        }
    } catch (error: any) {
        toast.error(error.message);
        setIsConnecting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>;
  if (!user) return null;

  if (!profile) {
     return (
        <div className="min-h-screen bg-[#0A0A0B] p-8 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-10 h-10 text-yellow-500 mx-auto animate-spin mb-4" />
                <p className="text-white">Syncing Profile...</p>
                <Button onClick={handleRecoverProfile} className="mt-4" variant="outline">Force Retry</Button>
            </div>
        </div>
     );
  }

  // SUPER ADMIN LOGIC
  const isPlatformOwner = user.email?.toLowerCase() === "konamak@icloud.com";
  const isStripeConnected = profile.stripe_onboarding_complete || isPlatformOwner;

  const isNewDJ = profile.dj_name === "New DJ" || !profile.dj_name;

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-2">Manage your DJ profile and payout settings.</p>
        </div>

        {/* New DJ Banner */}
        {isNewDJ && (
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-l-4 border-purple-500 p-4 rounded-r-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="p-2 bg-purple-500/20 rounded-full">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <p className="font-bold text-white">Let's set up your profile!</p>
                    <p className="text-sm text-gray-300">Your current name is "New DJ". Pick a stage name below to look professional to fans.</p>
                </div>
            </div>
        )}

        {/* Payouts Card */}
        <div className="bg-[#1A1A1B] rounded-2xl p-6 border border-[#2D2D2D]">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Banknote className="w-6 h-6 text-green-400" />
                    Payouts & Banking
                </h2>
                {isStripeConnected && (
                    <span className={`flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full border ${isPlatformOwner ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                        {isPlatformOwner ? <Crown className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        {isPlatformOwner ? "Platform Owner" : "Active"}
                    </span>
                )}
            </div>
            
            {!isStripeConnected && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6">
                    <h3 className="text-blue-400 font-bold flex items-center gap-2 mb-2 text-sm">
                        <Info className="w-4 h-4" /> How to Get Paid
                    </h3>
                    <ol className="list-decimal list-inside text-sm text-gray-300 space-y-2 ml-1">
                        <li>Click <strong>Connect with Stripe</strong> below.</li>
                        <li>Enter your bank details on Stripe&apos;s secure portal.</li>
                        <li>Once verified, you&apos;ll be redirected back here.</li>
                        <li>Your <strong>Go Live</strong> button will unlock instantly!</li>
                    </ol>
                </div>
            )}
            
            <p className="text-gray-400 mb-6 text-sm">
                {isStripeConnected 
                    ? (isPlatformOwner ? "You are the platform owner. All payments are routed directly to your main Stripe account." : "Your bank account is connected. You receive payouts instantly when requests are made.")
                    : "Connect your bank account to start accepting paid song requests. We use Stripe for secure payouts."
                }
            </p>

            {isPlatformOwner ? (
                 <div className="text-yellow-500 text-sm italic">
                    Super Admin Mode Active: Direct Payouts
                 </div>
            ) : (
                isStripeConnected ? (
                    <Button onClick={handleConnectStripe} variant="outline" className="w-full border-gray-700 hover:bg-gray-800 text-white">
                        <ExternalLink className="w-4 h-4 mr-2" /> Manage Stripe Account
                    </Button>
                ) : (
                    <Button 
                        onClick={handleConnectStripe} 
                        disabled={isConnecting}
                        className="w-full bg-[#635BFF] hover:bg-[#534be0] text-white font-bold h-12"
                    >
                        {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Banknote className="w-5 h-5 mr-2" />}
                        Connect with Stripe
                    </Button>
                )
            )}
        </div>

        {/* Profile Form */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-[#0A0A0B] border border-[#2D2D2D] rounded-xl text-white focus:border-purple-500 resize-none"
                disabled={isSaving}
              />
            </div>
             <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center gap-2 hover:from-purple-500 hover:to-pink-500"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? "Saving..." : "Save Profile Changes"}
          </button>
          </div>
        </form>
      </div>
    </div>
  );
}
