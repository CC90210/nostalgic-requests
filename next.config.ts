import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 2026-08-29 (Cloudflare migration): imports switched to @libsql/client/web —
  // pure fetch transport, no native bindings — so the old serverExternalPackages
  // escape hatch (which existed to keep the NATIVE driver out of the bundle) is
  // gone and the client bundles cleanly on both Vercel and Workers.
  // Tracing drops hrana-client's ws shim, breaking the OpenNext bundle step —
  // same fix as ig-setter-pro; the package's default export is dependency-free.
  outputFileTracingIncludes: {
    "/**/*": ["./node_modules/@libsql/isomorphic-ws/**/*"],
  },
  typescript: {
    // Allows production builds to complete even if your project has type errors
    // Use ONLY if really needed for deployment speed/rescue
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "is1-ssl.mzstatic.com",
      },
      {
        protocol: "https",
        hostname: "*.mzstatic.com",
      },
      {
        protocol: "https",
        hostname: "i1.sndcdn.com",
      },
      {
        protocol: "https",
        hostname: "files.stripe.com",
      }
    ],
  },
  async headers() {
    return [
      {
        // CORS for /api ported from vercel.json (2026-08-29, Cloudflare
        // migration). Vercel's regions:["iad1"] + maxDuration:30 have no
        // Workers equivalent and are deliberately dropped.
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
  env: {
    // Fallbacks to avoid build time crashes if these are accessed at build time (e.g. by client components)
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  }
};

export default nextConfig;
