import type { NextConfig } from "next";
import { SERVICE_OFFLINE } from "./lib/siteStatus";

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

  // While the backend is paused, send the authenticated routes back to the
  // landing page so bookmarks and stale links don't land on a dashboard that
  // hangs on a dead API. `permanent: false` (307) on purpose — a 308 would be
  // cached by browsers and keep redirecting after the app is restored.
  async redirects() {
    if (!SERVICE_OFFLINE) return [];

    return [
      { source: "/student", destination: "/", permanent: false },
      { source: "/student/:path*", destination: "/", permanent: false },
      { source: "/organization", destination: "/", permanent: false },
      { source: "/organization/:path*", destination: "/", permanent: false },
      // Shared event invite links are the most likely stale bookmark of all.
      { source: "/events/:path*", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
