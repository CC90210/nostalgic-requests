"use client";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-32">
        <h1 className="text-4xl font-bold mb-8 text-purple-400">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-purple-400">
          
          <p><strong>Last Updated:</strong> December 30, 2025</p>

          <h2>1. Introduction</h2>
          <p>Nostalgic Requests ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.</p>

          <h2>2. Information We Collect</h2>
          <h3>2.1 Information You Provide</h3>
          <ul>
            <li><strong>Account Information:</strong> Name, Email, Phone number, Payment information (processed by Stripe), Profile information.</li>
            <li><strong>Event Information:</strong> Event names, venues, and pricing.</li>
            <li><strong>Transaction Information:</strong> Song requests, payment amounts, transaction history.</li>
          </ul>

          <h3>2.2 Information Collected Automatically</h3>
          <ul>
            <li>Device Information: IP address, Browser type, Device type.</li>
            <li>Usage Information: Pages visited, Time spent, Click patterns.</li>
            <li>Cookies and Tracking: Session cookies, Analytics cookies.</li>
          </ul>

          <h3>2.3 Information from Third Parties</h3>
          <ul>
             <li><strong>Stripe:</strong> Payment and identity verification data.</li>
             <li><strong>iTunes API:</strong> Song catalog information.</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide, operate, and maintain the Service.</li>
            <li>Process transactions and send related information.</li>
            <li>Send administrative notifications.</li>
            <li>Respond to inquiries and provide customer support.</li>
            <li>Comply with legal obligations.</li>
          </ul>

          <h2>4. How We Share Your Information</h2>
          <ul>
             <li><strong>Service Providers:</strong> Stripe (Payments), Supabase (Database), Vercel (Hosting), Twilio (SMS).</li>
             <li><strong>Legal Requirements:</strong> To comply with court orders or protect rights.</li>
          </ul>
          <p>We do NOT sell your personal information or share it for third-party advertising.</p>

          <h2>5. Data Security</h2>
          <p>We implement industry-standard security measures including 256-bit encryption. However, no method of transmission is 100% secure.</p>

          <h2>6. Your Rights</h2>
          <p>Depending on your location, you may have rights to access, correct, delete, or export your data. Contact support@nostalgicrequests.com to exercise these rights.</p>

          <h2>7. Contact Us</h2>
          <p>For questions about this Privacy Policy, contact us at:</p>
          <ul>
             <li><strong>Email:</strong> support@nostalgicrequests.com</li>
             <li><strong>Address:</strong> Toronto, Ontario, Canada</li>
          </ul>

        </div>
      </main>
      <Footer />
    </div>
  );
}
