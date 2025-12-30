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
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Simple Pricing. You Keep 95%.</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            We take just 5% of each request.  No monthly fees. No hidden charges. Start free and only pay when you earn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-start">
            
            {/* Standard Tiers */}
            <div className="bg-[#1A1A1B] rounded-3xl p-8 border border-[#2D2D2D] relative overflow-hidden h-full">
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

            {/* Fees Breakdown */}
            <div className="space-y-8">
                <div className="bg-[#1A1A1B] border border-[#2D2D2D] rounded-3xl p-8">
                     <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Your Earnings Breakdown</h3>
                     <div className="space-y-4 font-mono text-sm">
                         <div className="flex justify-between text-gray-400">
                             <span>Guest Pays:</span>
                             <span>.00</span>
                         </div>
                         <div className="flex justify-between text-red-400/80">
                             <span>Platform Fee (5%):</span>
                             <span>-.50</span>
                         </div>
                          <div className="flex justify-between text-red-400/80">
                             <span>Stripe Fee (~2.9% + 30 cents):</span>
                             <span>-.59</span>
                         </div>
                         <div className="border-t border-white/10 my-4 pt-4 flex justify-between text-green-400 text-lg font-bold">
                             <span>You Receive:</span>
                             <span>.91</span>
                         </div>
                     </div>
                     <p className="text-xs text-gray-500 mt-6">
                        *Fees are approximate. Stripe fees vary by region and card type.
                     </p>
                </div>

                 <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h4 className="font-bold text-white mb-2">Pro & Enterprise Plans</h4>
                    <p className="text-gray-400 text-sm">Lower fees coming soon for high-volume venues and agencies.</p>
                 </div>
            </div>

        </div>
      </div>
    </section>
  );
}
