"use client";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

/**
 * /dmca — public copyright-notice intake.
 *
 * Kept as its own route (rather than only a section inside /terms) because
 * complainants are third parties who will never have an account and need a
 * findable, linkable address. Mirrors section 18 of the Terms of Service.
 */
export default function DmcaPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-32">
        <h1 className="text-4xl font-bold mb-8 text-purple-400">
          Copyright &amp; DMCA Notices
        </h1>
        <div className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-purple-400">
          <p>
            <strong>Last Updated:</strong> July 27, 2026
          </p>

          <h2>Designated Agent</h2>
          <p>
            Send all copyright notices to our designated agent at{" "}
            <strong>dmca@nostalgicrequests.com</strong>. Notices sent to any
            other address may not receive a timely response.
          </p>

          <h2>What a Valid Notice Must Contain</h2>
          <p>
            To be effective under 17 U.S.C. § 512(c)(3), your notice must
            include all six of the following:
          </p>
          <ol>
            <li>A physical or electronic signature.</li>
            <li>Identification of the copyrighted work you say was infringed.</li>
            <li>
              Identification of the material you say is infringing, specific
              enough that we can locate it.
            </li>
            <li>Your name, address, telephone number, and email.</li>
            <li>
              A statement that you have a good faith belief the use is not
              authorized by the copyright owner, its agent, or the law.
            </li>
            <li>
              A statement, under penalty of perjury, that the notice is accurate
              and that you are the owner or authorized to act for the owner.
            </li>
          </ol>

          <h2>Counter-Notice</h2>
          <p>
            If your content was removed and you believe that was a mistake or
            misidentification, you may send a counter-notice under 17 U.S.C.
            § 512(g) to the same address. We may restore the material 10 to 14
            business days after forwarding a valid counter-notice, unless the
            complainant notifies us they have filed a court action.
          </p>

          <h2>Canadian Notice-and-Notice</h2>
          <p>
            We operate from Canada. For content associated with Canadian users,
            sections 41.25 to 41.27 of the <em>Copyright Act</em> (Canada)
            apply. Under that regime we forward a compliant notice to the
            affected user and retain records; Canadian law does not require
            removal on receipt of a notice alone.
          </p>

          <h2>Music Licensing Is Not Provided</h2>
          <p>
            Nostalgic Requests does not grant any music performance, mechanical,
            or synchronization license. Song titles and requests are
            user-generated content submitted by Guests. Performers are solely
            responsible for holding the appropriate licenses (SOCAN, ASCAP, BMI,
            or equivalent) for any music they perform, and for any venue-level
            licensing obligations.
          </p>

          <h2>Repeat Infringers and Misrepresentation</h2>
          <p>
            We terminate the accounts of repeat infringers in appropriate
            circumstances. Under 17 U.S.C. § 512(f), knowingly misrepresenting
            that material is infringing can make you liable for damages,
            including costs and attorneys&rsquo; fees.
          </p>

          <p>
            The full policy is in section 18 of our{" "}
            <a href="/terms">Terms of Service</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
