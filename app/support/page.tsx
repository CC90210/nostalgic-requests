"use client";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import { Mail, MessageCircle, FileText, HelpCircle } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-32">
        
        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">How Can We Help?</h1>
            <p className="text-xl text-gray-400">We&apos;re here to ensure your events run smoothly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            
            {/* Email Support */}
            <div className="bg-[#1A1A1B] p-8 rounded-2xl border border-[#2D2D2D] hover:border-purple-500/50 transition-colors">
                <div className="w-12 h-12 bg-purple-900/20 rounded-xl flex items-center justify-center mb-6 text-purple-400">
                    <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Email Support</h3>
                <p className="text-gray-400 mb-6">For general inquiries, account issues, or billing questions.</p>
                <a href="mailto:support@nostalgicrequests.com" className="text-purple-400 font-bold hover:underline">
                    support@nostalgicrequests.com
                </a>
                <p className="text-xs text-gray-500 mt-2">Response time: 24-48 hours</p>
            </div>

            {/* Bug Report */}
            <div className="bg-[#1A1A1B] p-8 rounded-2xl border border-[#2D2D2D] hover:border-pink-500/50 transition-colors">
                <div className="w-12 h-12 bg-pink-900/20 rounded-xl flex items-center justify-center mb-6 text-pink-400">
                    <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Report an Issue</h3>
                <p className="text-gray-400 mb-6">Found a bug? Let us know so we can fix it.</p>
                <a href="mailto:bugs@nostalgicrequests.com" className="text-pink-400 font-bold hover:underline">
                    bugs@nostalgicrequests.com
                </a>
            </div>

        </div>

        {/* Quick Links */}
        <div className="bg-[#0F0F10] rounded-2xl p-8 border border-white/5">
            <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5" /> Quick Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/terms" className="flex items-center gap-3 p-4 rounded-xl bg-[#1A1A1B] hover:bg-[#252526] transition-colors border border-white/5">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-200">Terms of Service</span>
                </Link>
                <Link href="/privacy" className="flex items-center gap-3 p-4 rounded-xl bg-[#1A1A1B] hover:bg-[#252526] transition-colors border border-white/5">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-200">Privacy Policy</span>
                </Link>
                <Link href="/#faq" className="flex items-center gap-3 p-4 rounded-xl bg-[#1A1A1B] hover:bg-[#252526] transition-colors border border-white/5">
                    <HelpCircle className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-200">FAQ</span>
                </Link>
            </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
