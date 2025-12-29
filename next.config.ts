import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allows production builds to complete even if your project has type errors
    // Use ONLY if really needed for deployment speed/rescue
    ignoreBuildErrors: true, 
  },
  eslint: {
     // Allows production builds to complete even if your project has eslint errors
    ignoreDuringBuilds: true,
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
  env: {
     // Fallbacks to avoid build time crashes if these are accessed at build time (e.g. by client components)
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  }
};

export default nextConfig;
