"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FAQ() {
  const faqs = [
    { q: "How much does Nostalgic Requests cost?", a: "We take 5% of each transaction. There are no monthly fees, setup fees, or hidden charges. You only pay when you earn. Stripe's standard processing fees (approximately 2.9% + 30 cents) are charged separately by Stripe." },
    { q: "Do my guests need to download an app?", a: "No. The request portal works instantly in any mobile browser. Guests just scan your QR code and start requesting." },
    { q: "What payment methods do you accept?", a: "Apple Pay, Google Pay, and all major credit/debit cards. We use Stripe for secure, PCI-compliant payment processing." },
    { q: "Can I set my own prices?", a: "Absolutely. You control the pricing for every tier and add-on. We provide suggested defaults, but you decide what works for your audience." },
    { q: "How do I get my money?", a: "Payments go directly to your connected Stripe account. Stripe offers daily payouts to your bank account." },
    { q: "Is my data secure?", a: "Yes. We use bank-level 256-bit encryption. Your data is stored securely and never sold to third parties." },
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
