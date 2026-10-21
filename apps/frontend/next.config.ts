import { z } from "zod";

import type { NextConfig } from "next";

export default {
  experimental: {
    authInterrupts: true,
    testProxy: z
      .stringbool()
      .default(false)
      .parse(process.env["ENABLE_TEST_PROXY"]),
    typedEnv: true,
  },
  cacheComponents: true,
  typedRoutes: true,
  images: {
    remotePatterns: [
      new URL("https://images.pexels.com/photos/**"),
      new URL("https://image.tmdb.org/t/p/**"),
      new URL("https://artworks.thetvdb.com/**"),
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
