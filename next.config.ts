import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Partial Prerendering: serve a static shell instantly, stream dynamic content
    ppr: 'incremental',
    // Keep serverless functions warm between requests (reduces cold starts)
    serverComponentsHmrCache: true,
  },
};

export default nextConfig;
