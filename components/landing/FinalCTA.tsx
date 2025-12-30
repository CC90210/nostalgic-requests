"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-32 relative overflow-hidden">
       {/* Background Gradient */}
       <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-pink-900 z-0"></div>
       <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
       
       <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
           <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Your Next Gig Could Pay More</h2>
           <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
               Set up in 2 minutes. Start accepting paid requests tonight. No credit card required to start.
           </p>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Link
                    href="/signup"
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-purple-900 font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                    Create Your Free Account <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                    href="/login"
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-transparent border border-white/20 text-white font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center"
                >
                    Sign In
                </Link>
           </div>
       </div>
    </section>
  );
}
