"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FAQ() {
  const faqs = [
    { q: "Is it really free for performers?", a: "Yes. We don't verify charge a monthly subscription. You keep 100% of the request revenue minus standard Stripe processing fees." },
    { q: "Do guests need an app?", a: "No app required. The QR code opens a web portal instantly in their browser (Safari, Chrome, etc)." },
    { q: "How do I get paid?", a: "Funds are transferred directly to your connected Stripe account. You can set up daily or weekly payouts." },
    { q: "Can I customize the prices?", a: "Absolutely. You have full control over the pricing for Single requests, Packs, and Add-ons." },
    { q: "Does it work for bands?", a: "Yes! Any performer who takes requests can use it." },
  ];

  return (
    <section className="py-24 bg-[#0A0A0B]">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
            {faqs.map((item, i) => (
                <FAQItem key={i} question={item.q} answer={item.a} />
            ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-white/10 rounded-xl bg-[#1A1A1B] overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
            >
                <span className="font-bold text-white text-lg">{question}</span>
                <ChevronDown className={cn("text-gray-400 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>
            <div 
                className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <p className="p-6 pt-0 text-gray-400 leading-relaxed">
                    {answer}
                </p>
            </div>
        </div>
    )
}
