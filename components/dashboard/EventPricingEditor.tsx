"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DollarSign, Save, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PricingState {
  price_single: number;
  price_double: number;
  price_party: number;
  price_priority: number;
  price_shoutout: number;
  price_guaranteed: number;
}

export default function EventPricingEditor({ eventId, initialPricing }: { eventId: string, initialPricing: PricingState }) {
  const [prices, setPrices] = useState<PricingState>(initialPricing);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrices({ ...prices, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("events")
        .update(prices)
        .eq("id", eventId);

      if (error) throw error;
      toast.success("Prices updated instantly! Refresh public page to see changes.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update prices");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          Live Pricing
        </h2>
        <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Save Changes
        </Button>
      </div>

      <div className="space-y-6">
        {/* Packages */}
        <div className="space-y-4">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Packages</h3>
             <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className="text-gray-400 text-xs">Single</Label>
                    <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input name="price_single" type="number" value={prices.price_single} onChange={handleChange} className="pl-5 bg-black/40 border-gray-700 h-9" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-gray-400 text-xs">Double</Label>
                     <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input name="price_double" type="number" value={prices.price_double} onChange={handleChange} className="pl-5 bg-black/40 border-gray-700 h-9" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-gray-400 text-xs">Party</Label>
                     <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input name="price_party" type="number" value={prices.price_party} onChange={handleChange} className="pl-5 bg-black/40 border-gray-700 h-9" />
                    </div>
                </div>
             </div>
        </div>

        {/* Upsells */}
        <div className="space-y-4">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2 flex items-center gap-2">
                Upsells <Sparkles className="w-3 h-3 text-amber-500" />
             </h3>
             <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className="text-amber-500 text-xs">Priority</Label>
                     <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input name="price_priority" type="number" value={prices.price_priority} onChange={handleChange} className="pl-5 bg-black/40 border-gray-700 h-9 focus:border-amber-500" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-cyan-500 text-xs">Shoutout</Label>
                     <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input name="price_shoutout" type="number" value={prices.price_shoutout} onChange={handleChange} className="pl-5 bg-black/40 border-gray-700 h-9 focus:border-cyan-500" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-red-500 text-xs">Next</Label>
                     <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input name="price_guaranteed" type="number" value={prices.price_guaranteed} onChange={handleChange} className="pl-5 bg-black/40 border-gray-700 h-9 focus:border-red-500" />
                    </div>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}
