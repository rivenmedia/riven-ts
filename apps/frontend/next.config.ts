// oxlint-disable node/no-sync

import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";

import type { NextConfig } from "next";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  exports?: Record<string, string | Record<string, string>>;
}

const readPackageJson = (packageDir: string) =>
  JSON.parse(
    readFileSync(path.join(packageDir, "package.json"), { encoding: "utf8" }),
  ) as PackageJson;

const getWorkspaceDependencies = (
  parentDir: string,
  dependencies: Record<string, string> = {},
) =>
  Object.entries(dependencies)
    .filter(([, version]) => version.startsWith("workspace:"))
    .map(([name]) => ({
      name,
      packageDir: realpathSync(path.join(parentDir, "node_modules", name)),
    }));

/**
 * Turbopack doesn't support custom export conditions, so workspace packages
 * (including transitive ones) are aliased to their `@repo/source` exports.
 *
 * This keeps `next dev` and `next build` on the TypeScript sources,
 * without building dependencies first.
 */
function getWorkspaceSourceAliases() {
  const { dependencies, devDependencies } = readPackageJson(
    import.meta.dirname,
  );
  const queue = getWorkspaceDependencies(import.meta.dirname, {
    ...dependencies,
    ...devDependencies,
  });
  const visited = new Set<string>();
  const aliases: Record<string, string> = {};

  for (const { name, packageDir } of queue) {
    if (visited.has(packageDir)) {
      continue;
    }

    visited.add(packageDir);

    const packageJson = readPackageJson(packageDir);

    for (const [subpath, conditions] of Object.entries(
      packageJson.exports ?? {},
    )) {
      const source =
        typeof conditions === "string" ? undefined : conditions["@repo/source"];

      if (source) {
        aliases[path.posix.join(name, subpath)] = path.relative(
          import.meta.dirname,
          path.join(packageDir, source),
        );
      }
    }

    queue.push(
      ...getWorkspaceDependencies(packageDir, packageJson.dependencies),
    );
  }

  return aliases;
}

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
  turbopack: {
    resolveAlias: getWorkspaceSourceAliases(),
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
