"use client";

import { Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-[#1A1A1B]/80 backdrop-blur-xl border border-[#2D2D2D] rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-purple-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">Check your email</h1>
        
        <p className="text-gray-400 mb-8">
          We''ve sent a verification link to <span className="text-white font-medium">{email || "your email address"}</span>.
          <br />
          Please check your inbox (and spam folder) to activate your account.
        </p>

        <div className="space-y-4">
          <Link 
            href="/login"
            className="block w-full py-3 bg-[#2D2D2D] hover:bg-[#3D3D3D] rounded-xl text-white font-medium transition-all"
          >
            Return to Login
          </Link>
          
          <p className="text-sm text-gray-500">
            Didn''t receive the email?{" "}
            <button className="text-purple-400 hover:text-purple-300">
              Click to resend
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}

