import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    // Disable turbopack rules that cause issues on Windows
  },
  experimental: {
    // Use webpack instead of turbopack
  }
};

export default nextConfig;
