import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No output: 'export' — Vercel handles server-side rendering natively
  allowedDevOrigins: ["*.janeway.replit.dev", "*.replit.dev"],
};

export default nextConfig;
