"use client";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import UserTypes from "@/components/landing/UserTypes";
import Pricing from "@/components/landing/Pricing";
import Stats from "@/components/landing/Stats";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Nostalgic Requests",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free to start, 5% platform fee on earnings"
    },
    "description": "The premier platform for paid song requests. Maximize your earnings as a Performer.",
    "url": "https://nostalgicrequests.com",
    "publisher": {
      "@type": "Organization",
      "name": "Nostalgic Requests",
      "logo": "https://nostalgicrequests.com/icon.png"
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-purple-500/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <UserTypes />
      <Pricing />
      <Stats />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
