"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg shadow-purple-500/20 mb-6">
        <Image src="/logo.png" alt="Nostalgic Requests" width={80} height={80} className="w-full h-full object-cover" />
      </div>

      <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-4">
        Page Not Found
      </h1>
      <p className="text-gray-400 mb-8 max-w-md">
        The beat dropped, but the page didn&apos;t. This link might be broken or the event might have ended.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-full transition-all shadow-lg shadow-purple-500/25"
        >
          Go to Homepage
        </Link>

        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition-colors border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    </div>
  );
}
