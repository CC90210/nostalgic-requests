"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  const handleScroll = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#050506] border-t border-white/5 py-12 text-sm relative z-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-black border border-white/10">
                    <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-white">Nostalgic Requests</span>
            </div>

            <div className="flex gap-6 text-gray-500">
                <Link href="/support" className="hover:text-white transition-colors" onClick={handleScroll}>Support</Link>
                <Link href="/privacy" className="hover:text-white transition-colors" onClick={handleScroll}>Privacy</Link>
                <Link href="/terms" className="hover:text-white transition-colors" onClick={handleScroll}>Terms</Link>
            </div>

            <div className="text-gray-600 text-center md:text-right">
                <p>&copy; 2025 Nostalgic Requests.</p>
                <p>Made for performers, by performers.</p>
            </div>

        </div>
    </footer>
  );
}
