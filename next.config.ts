import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Disable Turbopack for production builds due to PostCSS compatibility
  experimental: {
    turbo: {
      enabled: false,
    },
  },
};

export default nextConfig;
