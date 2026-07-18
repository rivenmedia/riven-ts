import type { NextConfig } from "next";

export default {
  experimental: {
    authInterrupts: true,
    testProxy: true,
    typedEnv: true,
  },
  typedRoutes: true,
  images: {
    remotePatterns: [new URL("https://images.pexels.com/photos/**")],
  },
  redirects() {
    return [
      {
        source: "/setup",
        destination: "/setup/welcome",
        permanent: false,
      },
    ];
  },
} satisfies NextConfig;
