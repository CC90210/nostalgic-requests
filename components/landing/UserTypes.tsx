"use client";

import { Disc, Mic2, Guitar, Music2 } from "lucide-react";

export default function UserTypes() {
  const types = [
    { icon: Disc, label: "Club DJs" },
    { icon: Mic2, label: "Mobile DJs" },
    { icon: Guitar, label: "Live Bands" },
    { icon: Music2, label: "Solo Artists" },
    { icon: Mic2, label: "Karaoke" },
    { icon: Guitar, label: "Piano Bars" },
  ];

  return (
    <section className="py-20 border-y border-white/5 bg-[#0A0A0B] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-12">
           <h2 className="text-2xl font-bold text-white mb-4">For Every Performer Who Takes Requests</h2>
      </div>
      
      {/* Infinite Scroll Effect (Simplified with Flex for now) */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-8 max-w-5xl mx-auto">
          {types.map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-default">
                  <t.icon className="w-5 h-5 opacity-70" />
                  <span className="font-medium">{t.label}</span>
              </div>
          ))}
      </div>
    </section>
  );
}
