"use client";

import { useState } from "react";
import { Download, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

interface QRCodeActionsProps {
  qrCodeUrl?: string | null; // Optional now
  portalUrl: string;
}

export default function QRCodeActions({ portalUrl }: QRCodeActionsProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      // Generate QR Code as Data URL (PNG)
      const dataUrl = await QRCode.toDataURL(portalUrl, {
        width: 1200, // High resolution for print
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      });

      // Create download link
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `nostalgic-qr-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("QR code downloaded!");
    } catch (err) {
      console.error("QR Download Error:", err);
      toast.error("Failed to generate QR code download.");
    } finally {
      setDownloading(false);
    }
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
        disabled={downloading}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
      >
        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {downloading ? "Generating..." : "Download"}
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
