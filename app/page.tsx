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
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-purple-500/30">
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
