import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan Cloud Workstation domain mengakses resource dev Next.js
  allowedDevOrigins: ["*.cloudworkstations.dev"],
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
