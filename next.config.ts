import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 reactStrictMode: false,
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
