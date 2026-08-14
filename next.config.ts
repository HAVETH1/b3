import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep serverless functions warm between requests (reduces cold starts)
    serverComponentsHmrCache: true,
  },
};

export default nextConfig;
