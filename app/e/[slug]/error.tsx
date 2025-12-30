"use client";

import { useEffect } from "react";
import { RefreshCcw } from "lucide-react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Event Portal Runtime Error:", error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-black text-white p-6 text-center">
      <h2 className="text-2xl font-bold text-red-500 mb-2">Something went wrong!</h2>
      <p className="text-gray-400 mb-6 max-w-md">
        We encountered an error loading this event page. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full font-semibold transition-colors"
      >
        <RefreshCcw className="w-4 h-4" />
        Try Again
      </button>
      <pre className="mt-8 p-4 bg-gray-900 rounded text-xs text-left overflow-auto max-w-full text-red-400">
        {error.message}
      </pre>
    </div>
  );
}
