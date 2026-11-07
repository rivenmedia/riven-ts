import path from "node:path";
import { z } from "zod";

import type { NextConfig } from "next";

const monorepoRoot = path.join(import.meta.dirname, "../..");

export default {
  output: "standalone",
  // Next.js won't infer the monorepo root when it's also the home directory (e.g. `/app` in Docker)
  turbopack: { root: monorepoRoot },
  outputFileTracingRoot: monorepoRoot,
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
