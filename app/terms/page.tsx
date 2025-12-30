"use client";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-32">
        <h1 className="text-4xl font-bold mb-8 text-purple-400">Terms of Service</h1>
        <div className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-purple-400">
          
          <p><strong>Last Updated:</strong> December 30, 2025</p>

          <h2>1. Agreement to Terms</h2>
          <p>By accessing or using Nostalgic Requests ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these Terms, you may not access the Service.</p>

          <h2>2. Description of Service</h2>
          <p>Nostalgic Requests is a software-as-a-service (SaaS) platform that enables music performers ("Performers") to accept and manage paid song requests from their audience ("Guests") during live events.</p>

          <h2>3. Eligibility</h2>
          <ul>
            <li>You must be at least 18 years old to use this Service.</li>
            <li>You must have the legal capacity to enter into a binding agreement.</li>
            <li>By using this Service, you represent and warrant that you meet these requirements.</li>
          </ul>

          <h2>4. Account Registration</h2>
          <ul>
            <li>You must provide accurate, complete, and current information during registration.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You are responsible for all activities that occur under your account.</li>
            <li>You must notify us immediately of any unauthorized use of your account.</li>
          </ul>

          <h2>5. Performer Responsibilities</h2>
          <p>As a Performer, you agree to:</p>
          <ul>
            <li>Provide accurate information about yourself and your events.</li>
            <li>Comply with all applicable laws and regulations, including tax obligations.</li>
            <li>Not use the Service for any illegal or unauthorized purpose.</li>
            <li>Not infringe upon the rights of others, including intellectual property rights.</li>
            <li>Understand that accepting a song request does NOT obligate you to play that song.</li>
          </ul>

          <h2>6. Guest Responsibilities</h2>
          <p>As a Guest, you agree to:</p>
          <ul>
            <li>Provide accurate payment information.</li>
            <li>Understand that song requests are NOT guaranteed to be played.</li>
            <li>Understand that payments are generally non-refundable (see Refund Policy below).</li>
            <li>Not use the Service for any illegal or unauthorized purpose.</li>
          </ul>

          <h2>7. Payments and Fees</h2>
          <h3>7.1 Platform Fee</h3>
          <p>Nostalgic Requests charges a 5% platform fee on all transactions processed through the Service. This fee is automatically deducted from each transaction.</p>

          <h3>7.2 Payment Processing</h3>
          <p>Payments are processed by Stripe, Inc. ("Stripe"). Stripe's standard processing fees (approximately 2.9% + 30 cents per transaction) apply and are separate from our platform fee. By using the Service, you also agree to Stripe's Terms of Service.</p>

          <h3>7.3 Payouts</h3>
          <p>Funds are transferred to Performers' connected Stripe accounts. Payout timing is determined by Stripe's payout schedule (typically daily or weekly).</p>

          <h3>7.4 Taxes</h3>
          <p>Performers are solely responsible for determining, collecting, reporting, and remitting any applicable taxes related to their earnings through the Service.</p>

          <h2>8. Refund Policy</h2>
          <h3>8.1 General Policy</h3>
          <p>All song request payments are generally NON-REFUNDABLE. By making a payment, Guests acknowledge that:</p>
          <ul>
            <li>Song requests are requests, not guarantees.</li>
            <li>Performers have full discretion over which songs they play.</li>
            <li>Event circumstances may prevent songs from being played.</li>
          </ul>

          <h3>8.2 Exceptions</h3>
          <p>Refunds may be issued at Nostalgic Requests' sole discretion in cases of:</p>
          <ul>
            <li>Technical errors resulting in duplicate charges.</li>
            <li>Events that are cancelled before any requests are fulfilled.</li>
            <li>Verified fraudulent transactions.</li>
          </ul>

          <h3>8.3 Dispute Resolution</h3>
          <p>For refund requests, contact support@nostalgicrequests.com. We will review requests on a case-by-case basis.</p>

          <h2>9. Intellectual Property</h2>
          <h3>9.1 Our Property</h3>
          <p>The Service, including its original content, features, and functionality, is owned by Nostalgic Requests and is protected by copyright, trademark, and other intellectual property laws.</p>

          <h3>9.2 Your Content</h3>
          <p>You retain ownership of any content you submit through the Service. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute such content solely for the purpose of operating the Service.</p>

          <h3>9.3 Music Rights</h3>
          <p>Nostalgic Requests does NOT provide music licensing. Performers are solely responsible for ensuring they have the appropriate licenses and rights to perform any music at their events.</p>

          <h2>10. Disclaimer of Warranties</h2>
          <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</p>

          <h2>11. Contact Information</h2>
          <p>For questions about these Terms, contact us at:</p>
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
