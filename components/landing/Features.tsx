"use client";

import { Music, CreditCard, PieChart, Users, MessageSquare, List, Zap, Smartphone } from "lucide-react";

export default function Features() {
  const perfFeatures = [
    { icon: List, title: "Real-Time Queue", desc: "See requests live, sorted by priority." },
    { icon: CreditCard, title: "Instant Payments", desc: "Apple Pay, Google Pay, Cards. Payouts to Stripe." },
    { icon: PieChart, title: "Analytics", desc: "Track revenue, popular songs, and peak times." },
    { icon: Users, title: "Lead Capture", desc: "Collect phone numbers & emails for marketing." },
  ];

  const audienceFeatures = [
    { icon: Music, title: "Search Any Song", desc: "Integrated with iTunes catalog." },
    { icon: Zap, title: "No App Needed", desc: "Works instantly in mobile browser." },
    { icon: Smartphone, title: "SMS Alerts", desc: "Get notified when song is playing." },
    { icon: MessageSquare, title: "Dedication", desc: "Add names and messages to requests." },
  ];

  return (
    <section className="py-24 bg-[#0F0F10]">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* For Performers */}
            <div>
                 <div className="mb-10">
                    <span className="text-purple-400 font-bold uppercase tracking-wider text-sm mb-2 block">For Performers</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Command Your Crowd</h2>
                    <p className="text-gray-400">Tools to manage the chaos and maximize your earnings.</p>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {perfFeatures.map((f, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-[#1A1A1B] border border-[#2D2D2D] hover:border-purple-500/30 transition-colors">
                            <f.icon className="w-8 h-8 text-purple-500 mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                            <p className="text-sm text-gray-400">{f.desc}</p>
                        </div>
                    ))}
                 </div>
            </div>

            {/* For Audience */}
            <div>
                 <div className="mb-10">
                    <span className="text-pink-400 font-bold uppercase tracking-wider text-sm mb-2 block">For Audience</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Frictionless Fun</h2>
                    <p className="text-gray-400">The easiest way to hear their favorite songs.</p>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {audienceFeatures.map((f, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-[#1A1A1B] border border-[#2D2D2D] hover:border-pink-500/30 transition-colors">
                            <f.icon className="w-8 h-8 text-pink-500 mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                            <p className="text-sm text-gray-400">{f.desc}</p>
                        </div>
                    ))}
                 </div>
            </div>

        </div>
      </div>
    </section>
  );
}
