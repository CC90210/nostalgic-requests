"use client";

import { useState } from "react";
import { Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface QRCodeActionsProps {
  qrCodeUrl: string;
  portalUrl: string;
}

export default function QRCodeActions({ qrCodeUrl, portalUrl }: QRCodeActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    // Convert data URL to blob and download
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "nostalgic-qr-code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR code downloaded!");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="flex gap-2 w-full">
      <button
        onClick={handleDownload}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium transition-colors"
      >
        <Download className="w-4 h-4" />
        Download
      </button>
      <button
        onClick={handleCopyLink}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#2D2D2D] hover:bg-[#3D3D3D] rounded-xl text-white font-medium transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}

