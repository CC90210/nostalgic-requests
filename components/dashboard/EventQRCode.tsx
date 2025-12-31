"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function EventQRCode({ slug }: { slug: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    // 1. Get the ACTUAL browser URL logic (matches the working link)
    // Fallback to Env var if window undefined (SSR), though this is client component
    const origin = typeof window !== "undefined" 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || "https://nostalgicrequests.com";
    
    const fullUrl = `${origin}/e/${slug}`;
    setUrl(fullUrl);
  }, [slug]);

  if (!url) return <div className="animate-pulse bg-gray-700 h-48 w-48 rounded-xl"></div>;

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-4 rounded-xl mb-4">
        {/* 2. Encode the verified URL */}
        <QRCodeSVG 
          value={url} 
          size={192} // 48px * 4
          level="H" // High error correction
          includeMargin={true}
          className="w-48 h-48"
        />
      </div>
      
      {/* 3. Debug Text (Verify what is being encoded) */}
      <div className="bg-gray-900 p-2 rounded max-w-[250px] overflow-hidden">
        <p className="text-xs text-gray-500 font-mono text-center truncate">
          {url}
        </p>
      </div>
    </div>
  );
}

