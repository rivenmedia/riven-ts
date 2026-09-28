import type { NextConfig } from "next";

export default {
  experimental: {
    authInterrupts: true,
    testProxy: true,
    typedEnv: true,
  },
  cacheComponents: true,
  typedRoutes: true,
  images: {
    remotePatterns: [
      new URL("https://images.pexels.com/photos/**"),
      new URL("https://image.tmdb.org/t/p/**"),
    ],
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
