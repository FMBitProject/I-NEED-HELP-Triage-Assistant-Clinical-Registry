import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
