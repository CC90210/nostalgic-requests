"use client";

import { QrCode, Smartphone, ListMusic, CreditCard } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: QrCode,
      title: "Create Your Event",
      desc: "Set your venue, customize your pricing, get your QR code in seconds.",
      color: "text-purple-400",
      bg: "bg-purple-900/20"
    },
    {
      icon: Smartphone,
      title: "Share Your QR Code",
      desc: "Display it on screens, table tents, or social media. Audience scans with any phone camera.",
      color: "text-pink-400",
      bg: "bg-pink-900/20"
    },
    {
      icon: ListMusic,
      title: "Watch Requests Roll In",
      desc: "Real-time dashboard shows every request. See who paid, what they want, and when to play it.",
      color: "text-blue-400",
      bg: "bg-blue-900/20"
    },
    {
      icon: CreditCard,
      title: "Get Paid Instantly",
      desc: "Funds go directly to your Stripe account. You keep what you earn.",
      color: "text-green-400",
      bg: "bg-green-900/20"
    }
  ];

  return (
    <section className="py-24 bg-[#0A0A0B] relative">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">How It Works</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            A seamless experience for you and your audience. No app downloads required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                    <div key={i} className="relative group">
                        {/* Connecting Line (Desktop) */}
                        {i < 3 && (
                            <div className="hidden lg:block absolute top-8 left-1/2 w-full h-[2px] bg-gradient-to-r from-white/10 to-transparent z-0"></div>
                        )}
                        
                        <div className="relative z-10 flex flex-col items-center text-center p-6 rounded-2xl border border-white/5 bg-[#1A1A1B]/50 backdrop-blur-sm hover:border-white/10 transition-all hover:-translate-y-2 duration-300">
                             <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${step.bg} ${step.color} shadow-lg`}>
                                 <Icon className="w-8 h-8" />
                             </div>
                             <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                             <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    </section>
  );
}
