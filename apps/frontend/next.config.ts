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
  typescript: {
    tsconfigPath: "tsconfig.app.json",
    ignoreBuildErrors: true,
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
