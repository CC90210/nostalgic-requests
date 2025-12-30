"use client";

import { Music } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#050506] border-t border-white/5 py-12 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <Music className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">Nostalgic Requests</span>
            </div>

            <div className="flex gap-6 text-gray-500">
                <Link href="#" className="hover:text-white transition-colors">Support</Link>
                <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            </div>

            <div className="text-gray-600 text-center md:text-right">
                <p>&copy; 2025 Nostalgic Requests.</p>
                <p>Made for performers, by performers.</p>
            </div>

        </div>
    </footer>
  );
}
