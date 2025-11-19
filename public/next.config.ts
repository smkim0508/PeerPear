import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const { hostname: SUPABASE_HOSTNAME } = SUPABASE_URL
  ? new URL(SUPABASE_URL)
  : { hostname: "" };

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase CDN
      {
        protocol: "https",
        hostname: SUPABASE_HOSTNAME,
      },
      // Local dev server (Flask)
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5001",
      },
    ],
  },
};

export default nextConfig;
