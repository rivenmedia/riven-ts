import type { NextConfig } from "next";

export default {
  experimental: {
    authInterrupts: true,
    testProxy: true,
  },
  images: {
    remotePatterns: [new URL("https://images.pexels.com/photos/**")],
  },
} satisfies NextConfig;
