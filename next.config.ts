import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
