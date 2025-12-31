"use client";

import { useEffect } from "react";
import Image from "next/image";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="bg-black text-white flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg shadow-red-500/20 mb-8">
            <Image src="/logo.png" alt="Error" width={80} height={80} className="w-full h-full object-cover" />
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-4">
            System Overload
        </h2>
        <p className="text-gray-400 mb-8 max-w-md">
            Something critically went wrong. The music stopped, but we can restart it.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
        >
          Reboot System
        </button>
      </body>
    </html>
  );
}
