import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan Cloud Workstation domain mengakses resource dev Next.js
  allowedDevOrigins: [
    "*.cloudworkstations.dev",
    "*.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev",
  ],
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
