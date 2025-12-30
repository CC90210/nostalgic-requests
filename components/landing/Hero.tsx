"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight, Play } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
         <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[120px]" />
         <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        
        {/* Badge */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm"
        >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-gray-300">New for Performers</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight mb-8"
        >
            Turn Every Request <br className="hidden md:block" />
            Into <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-gradient">Revenue</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
            The song request platform that pays. Accept requests, collect payments, and build your audience—all from one QR code.
        </motion.p>

        {/* CTAs */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
             <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:opacity-90 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)]"
              >
                Start Free — Keep 95% <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 text-white font-semibold text-lg hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2"
              >
                Sign In
              </Link>
        </motion.div>

        {/* Visual Mockup Hint */}
        <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.5, duration: 1 }}
             className="mt-20 relative mx-auto max-w-5xl"
        >
            <div className="aspect-[16/9] bg-gradient-to-br from-[#1A1A1B] to-[#0F0F10] rounded-t-3xl border border-white/10 border-b-0 shadow-2xl overflow-hidden p-2 md:p-4">
                {/* Abstract Dashboard UI Representation */}
                <div className="w-full h-full bg-[#0A0A0B] rounded-xl flex overflow-hidden opacity-80">
                     <div className="w-64 bg-[#1A1A1B] border-r border-white/5 hidden md:block"></div>
                     <div className="flex-1 p-8 grid grid-cols-3 gap-6">
                         <div className="col-span-2 h-32 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/20"></div>
                         <div className="h-32 bg-white/5 rounded-xl"></div>
                         <div className="col-span-3 h-64 bg-white/5 rounded-xl"></div>
                     </div>
                </div>
                 {/* Floating Mobile UI */}
                 <div className="absolute -bottom-20 right-10 md:right-20 w-64 md:w-80 aspect-[9/19] bg-black rounded-[3rem] border-[8px] border-[#2D2D2D] shadow-2xl overflow-hidden z-20 hidden md:block">
                     <div className="w-full h-full bg-gradient-to-b from-purple-900 to-black p-4 flex flex-col items-center pt-12">
                         <div className="w-16 h-16 bg-white/10 rounded-xl mb-4 animate-pulse"></div>
                         <div className="w-32 h-4 bg-white/10 rounded-full mb-2"></div>
                         <div className="w-48 h-12 bg-purple-600 rounded-lg mt-8 shadow-[0_0_20px_purple]"></div>
                     </div>
                 </div>
            </div>
             <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A0A0B] to-transparent z-30"></div>
        </motion.div>

      </div>
    </section>
  );
}
