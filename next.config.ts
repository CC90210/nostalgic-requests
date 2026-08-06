import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @libsql/client ships native bindings (libsql / @neon-rs) that must load at
  // runtime from node_modules, not be traced into the webpack bundle — bundling
  // them is exactly the build failure Vercel showed on the first Turso deploy.
  serverExternalPackages: ["@libsql/client", "libsql"],
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
