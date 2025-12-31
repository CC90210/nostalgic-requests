"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            
            <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg shadow-purple-500/20">
                    <Image src="/logo.png" alt="Nostalgic Requests" width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-xl text-white">Nostalgic Requests</span>
            </Link>

            <div className="flex items-center gap-6">
                <Link href="#how-it-works" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden md:block">
                    How it Works
                </Link>
                <Link href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden md:block">
                    Pricing
                </Link>
                
                {user ? (
                     <Link href="/dashboard" className="px-5 py-2 rounded-full bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2">
                        Dashboard <ArrowRight className="w-4 h-4" />
                     </Link>
                ) : (
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-white hover:text-gray-300 transition-colors">
                            Sign In
                        </Link>
                        <Link href="/signup" className="px-5 py-2 rounded-full bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors">
                            Get Started
                        </Link>
                    </div>
                )}
            </div>
        </div>
    </nav>
  );
}
