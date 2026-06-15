import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Matikan dev overlay Next.js (sumber Geist font 403 di Cloud Workstation)
  devIndicators: false,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.cloudworkstations.dev",
        "localhost:3000",
      ],
    },
  },
};

export default nextConfig;
