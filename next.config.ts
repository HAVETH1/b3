import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Partial Prerendering: serve a static shell instantly, stream dynamic content
  cacheComponents: true,
  experimental: {
    // Keep serverless functions warm between requests (reduces cold starts)
    serverComponentsHmrCache: true,
  },
};

export default nextConfig;
