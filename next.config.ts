import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  env: {
    // Names the service worker's caches, so each deployment starts fresh.
    // Local builds use the build time.
    SW_VERSION: (
      process.env.VERCEL_GIT_COMMIT_SHA ?? `local-${Date.now()}`
    ).slice(0, 16),
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          // Always revalidated, so a new version is picked up straight away
          { key: "Cache-Control", value: "no-cache" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
