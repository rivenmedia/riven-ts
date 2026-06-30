import type { NextConfig } from "next";

export default {
  experimental: {
    testProxy: true,
  },
  images: {
    remotePatterns: [new URL("https://images.pexels.com/photos/**")],
  },
} satisfies NextConfig;
