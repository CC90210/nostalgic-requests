"use client";

import { Check, Sparkles } from "lucide-react";

export default function Pricing() {
  return (
    <section className="py-24 bg-[#0A0A0B]">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1 rounded-full bg-green-900/30 border border-green-500/30 text-green-400 text-sm font-bold mb-4">
              Performer Revenue Model
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Free for Performers. Forever.</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            You keep 100% of the request revenue*. We don&apos;t take a monthly fee or a cut of your tips.
          </p>
          <p className="text-xs text-gray-500 mt-4">*Standard Stripe processing fees apply (2.9% + 30 cents).</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
            
            {/* Standard Tiers */}
            <div className="bg-[#1A1A1B] rounded-3xl p-8 border border-[#2D2D2D] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-32 h-32 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-6">Audience Pricing Tiers</h3>
                <p className="text-gray-400 mb-8">This is what your audience sees. You can customize these prices.</p>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
                        <span className="font-bold text-white">Single Request</span>
                        <span className="text-purple-400 font-bold">.00</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500"></div>
                        <div>
                            <span className="font-bold text-white block">Double Up</span>
                            <span className="text-xs text-gray-400">2 Songs (Save )</span>
                        </div>
                        <span className="text-purple-400 font-bold">.00</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/20">
                        <div>
                            <span className="font-bold text-white block">Party Pack</span>
                            <span className="text-xs text-gray-400">5 Songs (Save )</span>
                        </div>
                        <span className="text-pink-400 font-bold">.00</span>
                    </div>
                </div>
            </div>

            {/* Upsells */}
            <div className="space-y-8">
                 <div>
                    <h3 className="text-2xl font-bold text-white mb-4">Revenue Boosters</h3>
                    <p className="text-gray-400 mb-6">Optional add-ons that significantly increase your earnings per request.</p>
                 </div>

                 <div className="space-y-6">
                     <div className="flex gap-4">
                         <div className="mt-1 w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
                             <Check className="w-4 h-4" />
                         </div>
                         <div>
                             <h4 className="text-white font-bold text-lg">Priority Play (+)</h4>
                             <p className="text-gray-400 text-sm">Audience pays extra to skip the line.</p>
                         </div>
                     </div>
                     <div className="flex gap-4">
                         <div className="mt-1 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                             <Check className="w-4 h-4" />
                         </div>
                         <div>
                             <h4 className="text-white font-bold text-lg">Shoutout (+)</h4>
                             <p className="text-gray-400 text-sm">Personal dedication read by you.</p>
                         </div>
                     </div>
                     <div className="flex gap-4">
                         <div className="mt-1 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                             <Check className="w-4 h-4" />
                         </div>
                         <div>
                             <h4 className="text-white font-bold text-lg">Guaranteed Next (+)</h4>
                             <p className="text-gray-400 text-sm">Premium tier. Plays immediately after current song.</p>
                         </div>
                     </div>
                 </div>
            </div>

        </div>
      </div>
    </section>
  );
}
